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
        $statement = $this->database->connect()->prepare("SELECT u.username,u.email,u.display_name,p.public_nickname,p.phone,p.address,p.birthday,p.privacy_json,EXISTS(SELECT 1 FROM license_users lu JOIN licenses l ON l.id=lu.license_id WHERE lu.user_id=u.id AND lu.membership_status='active' AND l.status='active') organization_sharing_available FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.id=:id LIMIT 1");
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
            'organizationSharingAvailable' => (bool) ($row['organization_sharing_available'] ?? false),
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
        $birthday = self::normalizeBirthday($payload['birthday'] ?? '');
        $pdo = $this->database->connect();
        $duplicate = $pdo->prepare("SELECT id FROM users WHERE email IS NOT NULL AND email <> '' AND LOWER(email)=LOWER(:email) AND id<>:id LIMIT 1");
        $duplicate->execute([':email' => $email, ':id' => $userId]);
        if ($email !== '' && $duplicate->fetchColumn() !== false) throw new \RuntimeException('Email already exists.');
        $currentProfile = $this->profile($userId);
        $privacyProvided = array_key_exists('privacy', $payload);
        $privacy = $privacyProvided ? self::normalizePrivacy(is_array($payload['privacy'] ?? null) ? $payload['privacy'] : []) : $currentProfile['privacy'];
        if ($privacyProvided && !($currentProfile['organizationSharingAvailable'] ?? false) && in_array(true, $privacy, true)) throw new \RuntimeException('Organization sharing requires an active organization assignment.');
        $pdo->prepare('UPDATE users SET email=:email,display_name=:display_name,updated_at=CURRENT_TIMESTAMP WHERE id=:id')->execute([
            ':email' => $email === '' ? null : $email, ':display_name' => trim((string) ($payload['displayName'] ?? '')), ':id' => $userId,
        ]);
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

    public static function normalizeBirthday(mixed $value): string
    { $birthday=trim((string)$value);if($birthday==='')return '';if(!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/',$birthday,$parts)||!checkdate((int)$parts[2],(int)$parts[3],(int)$parts[1]))throw new \RuntimeException('Birthday is invalid.');return $birthday; }

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
        $statement = $this->database->connect()->prepare("SELECT u.id,u.username,lu.membership_status status,u.created_at,lu.device_limit,p.public_nickname,p.phone,p.address,p.birthday,p.privacy_json,(SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id AND s.status='active' AND s.expires_at>CURRENT_TIMESTAMP) used_devices,(SELECT MAX(s.last_seen_at) FROM sessions s WHERE s.user_id=u.id) last_activity_at FROM license_users lu JOIN users u ON u.id=lu.user_id LEFT JOIN user_profiles p ON p.user_id=u.id WHERE lu.license_id=:license ORDER BY u.username");
        $statement->execute([':license'=>$licenseId]);
        $result = [];
        foreach ($statement->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $privacy = self::normalizePrivacy((array)(json_decode((string)($row['privacy_json']??'{}'), true) ?: []));
            $entry = ['id'=>(string)$row['id'],'username'=>(string)$row['username'],'status'=>(string)$row['status'],'createdAt'=>(string)$row['created_at'],'lastActivityAt'=>(string)($row['last_activity_at']??''),'usedDevices'=>(int)($row['used_devices']??0),'allowedDevices'=>$row['device_limit']===null?null:(int)$row['device_limit']];
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

    public function setMembershipStatus(int $actorUserId, int $targetUserId, string $status): void
    {
        if (!in_array($status, ['active', 'blocked'], true)) throw new \RuntimeException('Invalid membership status.');
        $licenseId = $this->managedLicenseId($actorUserId);
        $statement = $this->database->connect()->prepare('UPDATE license_users SET membership_status=:status WHERE license_id=:license AND user_id=:user');
        $statement->execute([':status'=>$status, ':license'=>$licenseId, ':user'=>$targetUserId]);
        if ($statement->rowCount() < 1) throw new \RuntimeException('License user not found.');
    }

    public function removeMembership(int $actorUserId, int $targetUserId): void
    {
        $licenseId = $this->managedLicenseId($actorUserId);
        $statement = $this->database->connect()->prepare("DELETE FROM license_users WHERE license_id=:license AND user_id=:user AND license_role<>'manager'");
        $statement->execute([':license'=>$licenseId, ':user'=>$targetUserId]);
        if ($statement->rowCount() < 1) throw new \RuntimeException('License user not found or cannot be removed.');
    }

    /** @return list<array<string,mixed>> */
    public function organizationDevices(int $actorUserId, ?int $targetUserId = null): array
    {
        $licenseId = $this->managedLicenseId($actorUserId);
        $sql = "SELECT s.session_id,s.user_id,s.device_id,s.device_label,s.last_seen_at,s.expires_at,s.status FROM sessions s JOIN license_users lu ON lu.user_id=s.user_id WHERE lu.license_id=:license AND s.device_id<>''";
        $params = [':license'=>$licenseId];
        if ($targetUserId !== null) { $sql .= ' AND s.user_id=:user'; $params[':user']=$targetUserId; }
        $sql .= ' ORDER BY s.last_seen_at DESC';
        $statement=$this->database->connect()->prepare($sql); $statement->execute($params);
        return array_map(static fn(array $row): array => ['sessionId'=>(string)$row['session_id'],'userId'=>(string)$row['user_id'],'deviceId'=>(string)$row['device_id'],'deviceLabel'=>(string)$row['device_label'],'lastActivityAt'=>(string)$row['last_seen_at'],'expiresAt'=>(string)$row['expires_at'],'status'=>(string)$row['status']], $statement->fetchAll(\PDO::FETCH_ASSOC));
    }

    public function revokeOrganizationDevice(int $actorUserId, int $targetUserId, string $sessionId): void
    {
        $licenseId=$this->managedLicenseId($actorUserId);
        $statement=$this->database->connect()->prepare("UPDATE sessions s JOIN license_users lu ON lu.user_id=s.user_id SET s.status='revoked',s.revoked_at=CURRENT_TIMESTAMP WHERE lu.license_id=:license AND s.user_id=:user AND s.session_id=:session AND s.status='active'");
        $statement->execute([':license'=>$licenseId,':user'=>$targetUserId,':session'=>$sessionId]);
        if ($statement->rowCount()<1) throw new \RuntimeException('License device not found.');
    }

    /** @return array<string,mixed> */
    public function createMedia(int $userId, string $bytes, string $storageRoot): array
    {
        $validated=self::validateProfileImage($bytes); $id=bin2hex(random_bytes(16));
        if (!is_dir($storageRoot) && !mkdir($storageRoot, 0700, true) && !is_dir($storageRoot)) throw new \RuntimeException('Media storage unavailable.');
        $extension=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$validated['mimeType']];
        $path=$id.'.'.$extension; $absolute=rtrim($storageRoot,'/').'/'.$path;
        if (file_put_contents($absolute,$bytes,LOCK_EX)!==strlen($bytes)) throw new \RuntimeException('Media storage failed.');
        @chmod($absolute,0600);
        try { $statement=$this->database->connect()->prepare("INSERT INTO user_media(user_id,media_type,storage_path,mime_type,byte_size,moderation_status) VALUES(:user,'profile',:path,:mime,:size,'pending')"); $statement->execute([':user'=>$userId,':path'=>$path,':mime'=>$validated['mimeType'],':size'=>$validated['byteSize']]); $mediaId=(int)$this->database->connect()->lastInsertId(); $this->recordMediaHistory($mediaId,$userId,null,'pending',null,null); }
        catch (\Throwable $exception) { @unlink($absolute); throw $exception; }
        return ['id'=>(string)$mediaId,'status'=>'pending','mimeType'=>$validated['mimeType'],'byteSize'=>$validated['byteSize']];
    }

    /** @return list<array<string,mixed>> */
    public function userMedia(int $userId): array
    { $s=$this->database->connect()->prepare('SELECT id,media_type,mime_type,byte_size,moderation_status,rejection_reason,created_at,updated_at FROM user_media WHERE user_id=:user ORDER BY id DESC'); $s->execute([':user'=>$userId]); return array_map(static fn(array $r):array=>['id'=>(string)$r['id'],'type'=>(string)$r['media_type'],'mimeType'=>(string)$r['mime_type'],'byteSize'=>(int)$r['byte_size'],'status'=>(string)$r['moderation_status'],'rejectionReason'=>(string)($r['rejection_reason']??''),'createdAt'=>(string)$r['created_at'],'updatedAt'=>(string)$r['updated_at']],$s->fetchAll(\PDO::FETCH_ASSOC)); }

    /** @return array<string,mixed> */
    public function moderateMedia(int $actorUserId, int $mediaId, string $action, string $reason='', string $note=''): array
    { if(!in_array($action,['approve','reject','delete'],true)) throw new \RuntimeException('Invalid moderation action.'); if($action==='reject'&&trim($reason)==='') throw new \RuntimeException('Rejection reason is required.'); $pdo=$this->database->connect(); $q=$pdo->prepare('SELECT moderation_status FROM user_media WHERE id=:id');$q->execute([':id'=>$mediaId]);$from=$q->fetchColumn();if($from===false)throw new \RuntimeException('Media not found.');$to=['approve'=>'approved','reject'=>'rejected','delete'=>'deleted'][$action];$u=$pdo->prepare('UPDATE user_media SET moderation_status=:status,rejection_reason=:reason,moderator_note=:note WHERE id=:id');$u->execute([':status'=>$to,':reason'=>$action==='reject'?trim($reason):null,':note'=>trim($note)===''?null:trim($note),':id'=>$mediaId]);$this->recordMediaHistory($mediaId,$actorUserId,(string)$from,$to,$reason,$note);return ['id'=>(string)$mediaId,'status'=>$to]; }

    /** @return array{path:string,mimeType:string} */
    public function mediaDelivery(int $mediaId, ?int $requesterId, bool $canModerate, string $storageRoot): array
    { $q=$this->database->connect()->prepare('SELECT user_id,storage_path,mime_type,moderation_status FROM user_media WHERE id=:id');$q->execute([':id'=>$mediaId]);$r=$q->fetch(\PDO::FETCH_ASSOC);if(!is_array($r)||((string)$r['moderation_status']!=='approved'&&(int)$r['user_id']!==$requesterId&&!$canModerate))throw new \RuntimeException('Media not found.');$name=basename((string)$r['storage_path']);if($name!==(string)$r['storage_path'])throw new \RuntimeException('Invalid media path.');return ['path'=>rtrim($storageRoot,'/').'/'.$name,'mimeType'=>(string)$r['mime_type']]; }

    private function recordMediaHistory(int $mediaId, ?int $actorId, ?string $from, string $to, ?string $reason, ?string $note): void
    { $s=$this->database->connect()->prepare('INSERT INTO media_moderation_history(media_id,actor_user_id,from_status,to_status,reason,note) VALUES(:media,:actor,:from,:to,:reason,:note)');$s->execute([':media'=>$mediaId,':actor'=>$actorId,':from'=>$from,':to'=>$to,':reason'=>trim((string)$reason)===''?null:trim((string)$reason),':note'=>trim((string)$note)===''?null:trim((string)$note)]); }

    /** @return list<array<string,mixed>> */
    public function packages(): array
    {
        $rows=$this->database->connect()->query("SELECT p.*,(SELECT COUNT(*) FROM licenses l WHERE l.package_id=p.id AND l.status='active') active_licenses FROM packages p ORDER BY p.name")->fetchAll(\PDO::FETCH_ASSOC);
        return array_map(fn(array $r):array=>$this->packagePayload($r),$rows);
    }

    /** @param array<string,mixed> $payload @return array<string,mixed> */
    public function savePackage(?int $id,array $payload): array
    {
        $key=strtolower(trim((string)($payload['key']??'')));$name=trim((string)($payload['name']??''));$description=trim((string)($payload['description']??''));$status=(string)($payload['status']??'active');
        if(!preg_match('/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/',$key))throw new \RuntimeException('Package key may contain lowercase letters, numbers, hyphens and underscores, but no spaces.');
        if($name===''||strlen($name)>190)throw new \RuntimeException('Package name is required and must not exceed 190 characters.');
        if(strlen($description)>500)throw new \RuntimeException('Package description must not exceed 500 characters.');
        if(!in_array($status,['active','inactive'],true))throw new \RuntimeException('Package status is invalid.');
        $modules=[];foreach((array)($payload['modules']??[]) as $module=>$state){if(preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/',(string)$module)&&in_array($state,['available','locked','hidden'],true))$modules[(string)$module]=$state;}
        $limit=$this->nullableLimit($payload['allowedDevices']??null);$entitlements=json_encode(['modules'=>$modules],JSON_THROW_ON_ERROR);$limits=json_encode(['allowedDevices'=>$limit],JSON_THROW_ON_ERROR);$pdo=$this->database->connect();
        if($id){$s=$pdo->prepare('UPDATE packages SET package_key=:key,name=:name,description=:description,entitlements_json=:entitlements,limits_json=:limits,status=:status WHERE id=:id');$params=[':id'=>$id];}else{$s=$pdo->prepare('INSERT INTO packages(package_key,name,description,entitlements_json,limits_json,status) VALUES(:key,:name,:description,:entitlements,:limits,:status)');$params=[];}
        $s->execute($params+[':key'=>$key,':name'=>$name,':description'=>$description===''?null:$description,':entitlements'=>$entitlements,':limits'=>$limits,':status'=>$status]);$savedId=$id?:((int)$pdo->lastInsertId());return $this->packageById($savedId);
    }

    public function deletePackage(int $id): void
    { $pdo=$this->database->connect();$q=$pdo->prepare('SELECT COUNT(*) FROM licenses WHERE package_id=:id');$q->execute([':id'=>$id]);if((int)$q->fetchColumn()>0)throw new \RuntimeException('Package is assigned to a license. Set it inactive instead.');$s=$pdo->prepare('DELETE FROM packages WHERE id=:id');$s->execute([':id'=>$id]);if($s->rowCount()<1)throw new \RuntimeException('Package not found.'); }

    /** @return list<array<string,mixed>> */
    public function licenses(): array
    { $rows=$this->database->connect()->query("SELECT l.*,p.name package_name,p.limits_json,(SELECT COUNT(*) FROM license_users lu WHERE lu.license_id=l.id AND lu.membership_status='active') used_seats,(SELECT lu.user_id FROM license_users lu WHERE lu.license_id=l.id AND lu.license_role='manager' AND lu.membership_status='active' ORDER BY lu.user_id LIMIT 1) manager_user_id,(SELECT u.username FROM license_users lu JOIN users u ON u.id=lu.user_id WHERE lu.license_id=l.id AND lu.license_role='manager' AND lu.membership_status='active' ORDER BY lu.user_id LIMIT 1) manager_username FROM licenses l JOIN packages p ON p.id=l.package_id ORDER BY l.organization_name")->fetchAll(\PDO::FETCH_ASSOC);return array_map(fn(array $r):array=>$this->licensePayload($r),$rows); }

    /** @param array<string,mixed> $payload @return array<string,mixed> */
    public function saveLicense(?int $id,array $payload): array
    {
        $key=strtolower(trim((string)($payload['key']??'')));
        $organization=trim((string)($payload['organizationName']??''));
        $packageId=(int)($payload['packageId']??0);
        $status=(string)($payload['status']??'active');
        $seats=$this->nullableLimit($payload['seatLimit']??null);
        $rawDevices=$payload['allowedDevices']??null;
        $requestedMode=(string)($payload['deviceLimitMode']??'');
        $deviceMode=$requestedMode==='default'?'package':($requestedMode==='custom'?'override':($requestedMode==='unlimited'?'unlimited':($rawDevices===null||$rawDevices===''?'package':($rawDevices==='unlimited'?'unlimited':'override'))));
        if(!in_array($deviceMode,['package','override','unlimited'],true))throw new \RuntimeException('Device limit mode is invalid.');
        $devices=$deviceMode==='override'?$this->nullableLimit($rawDevices):null;
        if(!preg_match('/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/',$key))throw new \RuntimeException('License key may contain lowercase letters, numbers, hyphens and underscores, but no spaces.');
        if($organization===''||strlen($organization)>190)throw new \RuntimeException('Organization is required and must not exceed 190 characters.');
        if($packageId<1)throw new \RuntimeException('Select a package.');
        if(!in_array($status,['active','blocked','inactive'],true))throw new \RuntimeException('License status is invalid.');
        $managerId=isset($payload['managerUserId'])&&trim((string)$payload['managerUserId'])!==''?(int)$payload['managerUserId']:null;
        $pdo=$this->database->connect();
        $package=$pdo->prepare('SELECT COUNT(*) FROM packages WHERE id=:id');$package->execute([':id'=>$packageId]);if((int)$package->fetchColumn()!==1)throw new \RuntimeException('Selected package does not exist.');
        if($managerId!==null){$manager=$pdo->prepare("SELECT COUNT(*) FROM users WHERE id=:id AND status='active'");$manager->execute([':id'=>$managerId]);if((int)$manager->fetchColumn()!==1)throw new \RuntimeException('Selected license manager is not an active user.');}
        $pdo->beginTransaction();
        try {
            if($id){$s=$pdo->prepare('UPDATE licenses SET license_key=:key,organization_name=:organization,package_id=:package,seat_limit=:seats,device_limit=:devices,device_limit_mode=:device_mode,status=:status WHERE id=:id');$params=[':id'=>$id];}else{$s=$pdo->prepare('INSERT INTO licenses(license_key,organization_name,package_id,seat_limit,device_limit,device_limit_mode,status) VALUES(:key,:organization,:package,:seats,:devices,:device_mode,:status)');$params=[];}
            $s->execute($params+[':key'=>$key,':organization'=>$organization,':package'=>$packageId,':seats'=>$seats,':devices'=>$devices,':device_mode'=>$deviceMode,':status'=>$status]);
            if($id&&$s->rowCount()<1){$exists=$pdo->prepare('SELECT COUNT(*) FROM licenses WHERE id=:id');$exists->execute([':id'=>$id]);if((int)$exists->fetchColumn()!==1)throw new \RuntimeException('License not found.');}
            $licenseId=$id?:((int)$pdo->lastInsertId());
            $pdo->prepare("DELETE FROM license_users WHERE license_id=:license AND license_role='manager'")->execute([':license'=>$licenseId]);
            if($managerId!==null){$membership=$pdo->prepare('SELECT COUNT(*) FROM license_users WHERE license_id=:license AND user_id=:user');$membership->execute([':license'=>$licenseId,':user'=>$managerId]);if((int)$membership->fetchColumn()>0)$pdo->prepare("UPDATE license_users SET license_role='manager',membership_status='active',device_limit=NULL,device_limit_mode='default' WHERE license_id=:license AND user_id=:user")->execute([':license'=>$licenseId,':user'=>$managerId]);else $pdo->prepare("INSERT INTO license_users(license_id,user_id,license_role,membership_status,device_limit,device_limit_mode) VALUES(:license,:user,'manager','active',NULL,'default')")->execute([':license'=>$licenseId,':user'=>$managerId]);}
            $pdo->commit();
        } catch (\Throwable $exception) { if($pdo->inTransaction())$pdo->rollBack();throw $exception; }
        foreach($this->licenses() as $license)if((int)$license['id']===$licenseId)return $license;
        throw new \RuntimeException('License could not be loaded.');
    }

    /** @return array{id:string,key:string} */
    public function deleteLicense(int $id): array
    {
        $pdo=$this->database->connect();
        $license=$pdo->prepare('SELECT license_key FROM licenses WHERE id=:id');$license->execute([':id'=>$id]);$key=$license->fetchColumn();
        if($key===false)throw new \RuntimeException('License not found.');
        $references=$pdo->prepare('SELECT COUNT(*) FROM license_users WHERE license_id=:id');$references->execute([':id'=>$id]);
        if((int)$references->fetchColumn()>0)throw new \RuntimeException('License still has assigned users or a manager. Remove those assignments or use Revoked / blocked instead.');
        $delete=$pdo->prepare('DELETE FROM licenses WHERE id=:id');$delete->execute([':id'=>$id]);
        if($delete->rowCount()!==1)throw new \RuntimeException('License could not be deleted.');
        return ['id'=>(string)$id,'key'=>(string)$key];
    }

    public function assignUserToLicense(int $userId,?int $licenseId,mixed $override): void
    { $pdo=$this->database->connect();if($licenseId===null){$pdo->prepare("DELETE FROM license_users WHERE user_id=:user AND license_role<>'manager'")->execute([':user'=>$userId]);return;}$seat=$pdo->prepare("SELECT l.seat_limit,(SELECT COUNT(*) FROM license_users WHERE license_id=l.id AND membership_status='active') used FROM licenses l WHERE l.id=:id AND l.status='active'");$seat->execute([':id'=>$licenseId]);$row=$seat->fetch(\PDO::FETCH_ASSOC);if(!is_array($row))throw new \RuntimeException('Active license not found.');$exists=$pdo->prepare('SELECT COUNT(*) FROM license_users WHERE license_id=:license AND user_id=:user');$exists->execute([':license'=>$licenseId,':user'=>$userId]);if((int)$exists->fetchColumn()===0&&$row['seat_limit']!==null&&(int)$row['used']>=(int)$row['seat_limit'])throw new \RuntimeException('License seat limit reached.');$mode=$override==='unlimited'?'unlimited':($override==='default'?'default':'override');$limit=$mode==='override'?$this->nullableLimit($override):null;$pdo->prepare("INSERT INTO license_users(license_id,user_id,license_role,membership_status,device_limit,device_limit_mode) VALUES(:license,:user,'member','active',:limit,:mode) ON DUPLICATE KEY UPDATE membership_status='active',device_limit=VALUES(device_limit),device_limit_mode=VALUES(device_limit_mode)")->execute([':license'=>$licenseId,':user'=>$userId,':limit'=>$limit,':mode'=>$mode]); }

    private function nullableLimit(mixed $value): ?int { if($value===null||$value===''||$value==='unlimited')return null;$limit=(int)$value;if($limit<1||$limit>1000)throw new \RuntimeException('Limit must be 1–1000 or unlimited.');return $limit; }
    private function packageById(int $id):array{$s=$this->database->connect()->prepare('SELECT p.*,(SELECT COUNT(*) FROM licenses l WHERE l.package_id=p.id AND l.status=\'active\') active_licenses FROM packages p WHERE p.id=:id');$s->execute([':id'=>$id]);$r=$s->fetch(\PDO::FETCH_ASSOC);if(!is_array($r))throw new \RuntimeException('Package not found.');return $this->packagePayload($r);}
    private function packagePayload(array $r):array{$e=json_decode((string)$r['entitlements_json'],true)?:[];$l=json_decode((string)$r['limits_json'],true)?:[];return ['id'=>(string)$r['id'],'key'=>(string)$r['package_key'],'name'=>(string)$r['name'],'description'=>(string)($r['description']??''),'status'=>(string)$r['status'],'modules'=>(array)($e['modules']??[]),'allowedDevices'=>$l['allowedDevices']??null,'activeLicenses'=>(int)($r['active_licenses']??0)];}
    private function licensePayload(array $r):array{$limits=json_decode((string)($r['limits_json']??'{}'),true)?:[];$mode=(string)($r['device_limit_mode']??'package');$allowed=$mode==='unlimited'?null:($mode==='override'?(int)$r['device_limit']:($limits['allowedDevices']??null));return ['id'=>(string)$r['id'],'key'=>(string)$r['license_key'],'organizationName'=>(string)$r['organization_name'],'packageId'=>(string)$r['package_id'],'packageName'=>(string)($r['package_name']??''),'seatLimit'=>$r['seat_limit']===null?null:(int)$r['seat_limit'],'usedSeats'=>(int)($r['used_seats']??0),'allowedDevices'=>$allowed,'deviceLimitMode'=>$mode==='package'?'default':($mode==='override'?'custom':'unlimited'),'deviceLimitSource'=>$mode==='package'?'package':'license','managerUserId'=>$r['manager_user_id']===null?null:(string)$r['manager_user_id'],'managerUsername'=>(string)($r['manager_username']??''),'status'=>(string)$r['status']];}

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

    /** @return array<string,string> */
    public function moduleEntitlementsForUser(int $userId): array
    { $s=$this->database->connect()->prepare("SELECT p.entitlements_json FROM license_users lu JOIN licenses l ON l.id=lu.license_id JOIN packages p ON p.id=l.package_id WHERE lu.user_id=:user AND lu.membership_status='active' AND l.status='active' AND p.status='active' LIMIT 1");$s->execute([':user'=>$userId]);$raw=$s->fetchColumn();if($raw===false)return [];$data=json_decode((string)$raw,true);return is_array($data['modules']??null)?$data['modules']:[]; }

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
