<?php
declare(strict_types=1);

namespace Neutral\Core;

final class AccountLicenseService
{
    public function __construct(private Database $database)
    {
    }

    /** @return array<string,mixed> */
    public function profile(int $userId): array
    {
        $statement = $this->database->connect()->prepare('SELECT u.username,u.email,u.display_name,p.public_nickname,p.phone,p.address,p.birthday,p.privacy_json FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.id=:id LIMIT 1');
        $statement->execute([':id' => $userId]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        if (!is_array($row)) throw new \RuntimeException('User profile not found.');
        $privacy = json_decode((string) ($row['privacy_json'] ?? '{}'), true);
        return [
            'username' => (string) $row['username'],
            'email' => (string) ($row['email'] ?? ''),
            'displayName' => (string) ($row['display_name'] ?? ''),
            'publicNickname' => (string) ($row['public_nickname'] ?? ''),
            'phone' => (string) ($row['phone'] ?? ''),
            'address' => (string) ($row['address'] ?? ''),
            'birthday' => (string) ($row['birthday'] ?? ''),
            'privacy' => self::normalizePrivacy(is_array($privacy) ? $privacy : []),
        ];
    }

    /** @param array<string,mixed> $payload @return array<string,mixed> */
    public function updateProfile(int $userId, array $payload): array
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new \RuntimeException('Email is invalid.');
        foreach (['displayName' => 190, 'publicNickname' => 120, 'phone' => 80, 'address' => 1000] as $field => $limit) {
            if (strlen(trim((string) ($payload[$field] ?? ''))) > $limit) throw new \RuntimeException($field . ' is too long.');
        }
        $birthday = trim((string) ($payload['birthday'] ?? ''));
        if ($birthday !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthday)) throw new \RuntimeException('Birthday is invalid.');
        $pdo = $this->database->connect();
        $duplicate = $pdo->prepare("SELECT id FROM users WHERE email IS NOT NULL AND email <> '' AND LOWER(email)=LOWER(:email) AND id<>:id LIMIT 1");
        $duplicate->execute([':email' => $email, ':id' => $userId]);
        if ($email !== '' && $duplicate->fetchColumn() !== false) throw new \RuntimeException('Email already exists.');
        $pdo->prepare('UPDATE users SET email=:email,display_name=:display_name,updated_at=CURRENT_TIMESTAMP WHERE id=:id')->execute([
            ':email' => $email === '' ? null : $email, ':display_name' => trim((string) ($payload['displayName'] ?? '')), ':id' => $userId,
        ]);
        $privacy = self::normalizePrivacy(is_array($payload['privacy'] ?? null) ? $payload['privacy'] : []);
        $pdo->prepare('INSERT INTO user_profiles(user_id,public_nickname,phone,address,birthday,privacy_json) VALUES(:id,:nickname,:phone,:address,:birthday,:privacy) ON DUPLICATE KEY UPDATE public_nickname=VALUES(public_nickname),phone=VALUES(phone),address=VALUES(address),birthday=VALUES(birthday),privacy_json=VALUES(privacy_json)')->execute([
            ':id'=>$userId, ':nickname'=>trim((string)($payload['publicNickname']??'')), ':phone'=>trim((string)($payload['phone']??'')), ':address'=>trim((string)($payload['address']??'')), ':birthday'=>$birthday===''?null:$birthday, ':privacy'=>json_encode($privacy, JSON_THROW_ON_ERROR),
        ]);
        return $this->profile($userId);
    }

    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        Phase4PasswordHasher::assertValid($newPassword);
        $pdo = $this->database->connect();
        $statement = $pdo->prepare('SELECT password_hash FROM users WHERE id=:id LIMIT 1');
        $statement->execute([':id'=>$userId]);
        $hash = (string) $statement->fetchColumn();
        if (!Phase4PasswordHasher::verify($currentPassword, $hash)) throw new \RuntimeException('Current password is incorrect.');
        $pdo->prepare('UPDATE users SET password_hash=:hash,updated_at=CURRENT_TIMESTAMP WHERE id=:id')->execute([':hash'=>Phase4PasswordHasher::hash($newPassword),':id'=>$userId]);
    }

    /** @return array<string,bool> */
    public static function normalizePrivacy(array $privacy): array
    {
        $result = [];
        foreach (['email','displayName','publicNickname','phone','address','birthday'] as $field) $result[$field] = ($privacy[$field] ?? false) === true;
        return $result;
    }

    /** @param array<string,mixed> $package @return array{state:string,requiredEntitlement:?string} */
    public static function moduleState(array $package, string $moduleId): array
    {
        $entitlements = is_array($package['entitlements'] ?? null) ? $package['entitlements'] : [];
        $state = (string) ($entitlements['modules'][$moduleId] ?? 'hidden');
        if (!in_array($state, ['available','locked','hidden'], true)) $state = 'hidden';
        return ['state'=>$state,'requiredEntitlement'=>$state === 'locked' ? (string)($package['key'] ?? '') : null];
    }

    public static function allowsLicenseScope(int $actorLicenseId, int $targetLicenseId): bool
    {
        return $actorLicenseId > 0 && $actorLicenseId === $targetLicenseId;
    }

    public function managedLicenseId(int $actorUserId): int
    {
        $statement = $this->database->connect()->prepare("SELECT license_id FROM license_users WHERE user_id=:user AND license_role='manager' LIMIT 1");
        $statement->execute([':user'=>$actorUserId]);
        return (int)($statement->fetchColumn() ?: 0);
    }

    /** @return list<array<string,mixed>> */
    public function organizationUsers(int $actorUserId): array
    {
        $licenseId = $this->managedLicenseId($actorUserId);
        if ($licenseId < 1) throw new \RuntimeException('License manager scope is unavailable.');
        $statement = $this->database->connect()->prepare('SELECT u.id,u.username,u.status,u.created_at,lu.device_limit,p.public_nickname,p.phone,p.address,p.birthday,p.privacy_json FROM license_users lu JOIN users u ON u.id=lu.user_id LEFT JOIN user_profiles p ON p.user_id=u.id WHERE lu.license_id=:license ORDER BY u.username');
        $statement->execute([':license'=>$licenseId]);
        $result = [];
        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $privacy = self::normalizePrivacy((array)(json_decode((string)($row['privacy_json']??'{}'), true) ?: []));
            $entry = ['id'=>(string)$row['id'],'username'=>(string)$row['username'],'status'=>(string)$row['status'],'createdAt'=>(string)$row['created_at'],'allowedDevices'=>$row['device_limit']===null?null:(int)$row['device_limit']];
            foreach (['publicNickname'=>'public_nickname','phone'=>'phone','address'=>'address','birthday'=>'birthday'] as $public=>$column) if ($privacy[$public]) $entry[$public]=(string)($row[$column]??'');
            $result[]=$entry;
        }
        return $result;
    }

    public function assignUser(int $actorUserId, int $targetUserId, ?int $deviceLimit = null): void
    {
        $licenseId = $this->managedLicenseId($actorUserId);
        if ($licenseId < 1) throw new \RuntimeException('License manager scope is unavailable.');
        $pdo=$this->database->connect();
        $limit=$pdo->prepare('SELECT seat_limit FROM licenses WHERE id=:id AND status=\'active\''); $limit->execute([':id'=>$licenseId]); $seatLimit=$limit->fetchColumn();
        $count=$pdo->prepare('SELECT COUNT(*) FROM license_users WHERE license_id=:id'); $count->execute([':id'=>$licenseId]);
        if ($seatLimit!==null && $seatLimit!==false && (int)$count->fetchColumn()>=(int)$seatLimit) throw new \RuntimeException('License seat limit reached.');
        $pdo->prepare("INSERT INTO license_users(license_id,user_id,license_role,device_limit) VALUES(:license,:user,'member',:limit) ON DUPLICATE KEY UPDATE device_limit=VALUES(device_limit)")->execute([':license'=>$licenseId,':user'=>$targetUserId,':limit'=>$deviceLimit]);
    }

    /** @return array<string,int> */
    public function installationMetrics(): array
    {
        $row = $this->database->connect()->query("SELECT COUNT(*) total,SUM(last_seen_at>=CURRENT_TIMESTAMP-INTERVAL 1 DAY) active_today,SUM(last_seen_at>=CURRENT_TIMESTAMP-INTERVAL 7 DAY) active_7,SUM(last_seen_at>=CURRENT_TIMESTAMP-INTERVAL 30 DAY) active_30,SUM(audience='anonymous') anonymous_viewer,SUM(audience='authenticated') authenticated FROM installation_presence")->fetch(\PDO::FETCH_ASSOC);
        return ['knownInstallationsTotal'=>(int)($row['total']??0),'activeToday'=>(int)($row['active_today']??0),'active7Days'=>(int)($row['active_7']??0),'active30Days'=>(int)($row['active_30']??0),'anonymousViewer'=>(int)($row['anonymous_viewer']??0),'authenticated'=>(int)($row['authenticated']??0)];
    }

    public function recordInstallation(string $installationId, ?int $userId): void
    {
        if (preg_match('/^[a-f0-9]{32}$/', $installationId) !== 1) return;
        $this->database->connect()->prepare("INSERT INTO installation_presence(installation_id,user_id,audience) VALUES(:id,:user,:audience) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id),audience=VALUES(audience),last_seen_at=CURRENT_TIMESTAMP")->execute([':id'=>$installationId,':user'=>$userId,':audience'=>$userId ? 'authenticated' : 'anonymous']);
    }

    /** @return array{mimeType:string,byteSize:int} */
    public static function validateProfileImage(string $bytes): array
    {
        $size = strlen($bytes);
        if ($size < 1 || $size > 5 * 1024 * 1024) throw new \RuntimeException('Profile image must be between 1 byte and 5 MB.');
        $info = @getimagesizefromstring($bytes);
        $mime = is_array($info) ? (string)($info['mime'] ?? '') : '';
        if (!in_array($mime, ['image/jpeg','image/png','image/webp'], true)) throw new \RuntimeException('Unsupported profile image.');
        return ['mimeType'=>$mime,'byteSize'=>$size];
    }
}
