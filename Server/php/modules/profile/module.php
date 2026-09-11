<?php
declare(strict_types=1);

use Neutral\Core\Database;
use Neutral\Core\ModuleHttpException;

return [
    'moduleId' => 'profile',
    'services' => [
        'module.profile.account' => static function (array $context): object {
            $database = $context['database'] ?? null;
            if (!$database instanceof Database) throw new RuntimeException('Profile storage is unavailable.');
            return new class($database) {
                public function __construct(private Database $database) {}
                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function get(array $context): array { return ['profile' => $this->read($this->userId($context))]; }
                /** @param array<string,mixed> $context @return array<string,mixed> */
                public function update(array $context): array
                {
                    $id=$this->userId($context);$payload=is_array($context['payload']??null)?$context['payload']:[];
                    $email=strtolower(trim((string)($payload['email']??'')));if($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))throw new ModuleHttpException('Email is invalid.',422,'PROFILE_EMAIL_INVALID');
                    foreach(['displayName'=>190,'publicNickname'=>120,'phone'=>80,'address'=>1000] as $field=>$limit)if(strlen(trim((string)($payload[$field]??'')))>$limit)throw new ModuleHttpException('Profile value is too long.',422,'PROFILE_VALUE_TOO_LONG');
                    $gender=strtolower(trim((string)($payload['gender']??'unspecified')));if(!in_array($gender,['male','female','unspecified'],true))throw new ModuleHttpException('Gender is invalid.',422,'PROFILE_GENDER_INVALID');
                    $birthday=trim((string)($payload['birthday']??''));if($birthday!==''&&(!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/',$birthday,$m)||!checkdate((int)$m[2],(int)$m[3],(int)$m[1])))throw new ModuleHttpException('Birthday is invalid.',422,'PROFILE_BIRTHDAY_INVALID');
                    $current=$this->read($id);$privacy=is_array($payload['privacy']??null)?$this->privacy($payload['privacy']):$current['privacy'];if(!$current['organizationSharingAvailable']&&in_array(true,$privacy,true))throw new ModuleHttpException('Organization sharing requires an active organization assignment.',422,'PROFILE_SHARING_UNAVAILABLE');
                    $avatar=array_key_exists('avatarData',$payload)?$this->avatar((string)$payload['avatarData']):($current['avatarData']??null);
                    $pdo=$this->database->connect();if($email!==''){$duplicate=$pdo->prepare('SELECT id FROM users WHERE LOWER(email)=:email AND id<>:id LIMIT 1');$duplicate->execute([':email'=>$email,':id'=>$id]);if($duplicate->fetchColumn()!==false)throw new ModuleHttpException('Email is already in use.',409,'PROFILE_EMAIL_EXISTS');}$pdo->prepare('UPDATE users SET email=:email,display_name=:name WHERE id=:id')->execute([':email'=>$email===''?null:$email,':name'=>trim((string)($payload['displayName']??'')),':id'=>$id]);
                    $pdo->prepare("INSERT INTO user_profiles(user_id,public_nickname,phone,address,birthday,gender,avatar_data,privacy_json) VALUES(:id,:nickname,:phone,:address,:birthday,:gender,:avatar,:privacy) ON DUPLICATE KEY UPDATE public_nickname=VALUES(public_nickname),phone=VALUES(phone),address=VALUES(address),birthday=VALUES(birthday),gender=VALUES(gender),avatar_data=VALUES(avatar_data),privacy_json=VALUES(privacy_json)")->execute([':id'=>$id,':nickname'=>trim((string)($payload['publicNickname']??'')),':phone'=>trim((string)($payload['phone']??'')),':address'=>trim((string)($payload['address']??'')),':birthday'=>$birthday===''?null:$birthday,':gender'=>$gender,':avatar'=>$avatar,':privacy'=>json_encode($privacy,JSON_THROW_ON_ERROR)]);
                    return ['profile'=>$this->read($id)];
                }
                /** @return array<string,mixed> */
                private function read(int $id): array { $s=$this->database->connect()->prepare("SELECT u.username,u.email,u.display_name,p.public_nickname,p.phone,p.address,p.birthday,p.gender,p.avatar_data,p.privacy_json,EXISTS(SELECT 1 FROM license_users lu JOIN licenses l ON l.id=lu.license_id WHERE lu.user_id=u.id AND lu.membership_status='active' AND l.status='active') share FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.id=:id");$s->execute([':id'=>$id]);$r=$s->fetch(PDO::FETCH_ASSOC);if(!is_array($r))throw new RuntimeException('Profile not found.');$privacy=json_decode((string)($r['privacy_json']??'{}'),true);return ['username'=>(string)$r['username'],'email'=>(string)($r['email']??''),'displayName'=>(string)($r['display_name']??''),'publicNickname'=>(string)($r['public_nickname']??''),'phone'=>(string)($r['phone']??''),'address'=>(string)($r['address']??''),'birthday'=>(string)($r['birthday']??''),'gender'=>(string)($r['gender']??'unspecified'),'avatarData'=>$r['avatar_data']??null,'privacy'=>$this->privacy(is_array($privacy)?$privacy:[]),'organizationSharingAvailable'=>(bool)$r['share']]; }
                private function avatar(string $value): ?string { if($value==='')return null;if(!preg_match('#^data:image/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$#',$value,$m))throw new ModuleHttpException('Avatar format is invalid.',422,'PROFILE_AVATAR_INVALID');$bytes=base64_decode($m[2],true);if($bytes===false||strlen($bytes)>262144||@getimagesizefromstring($bytes)===false)throw new ModuleHttpException('Avatar is invalid or too large.',422,'PROFILE_AVATAR_INVALID');$size=getimagesizefromstring($bytes);if(($size[0]??0)>256||($size[1]??0)>256||$size[0]!==$size[1])throw new ModuleHttpException('Avatar must be square and at most 256 px.',422,'PROFILE_AVATAR_DIMENSIONS');return $value; }
                /** @param array<string,mixed> $context */
                private function userId(array $context): int { $raw=(string)($context['identity']['userId']??'');if(!ctype_digit($raw)||(int)$raw<1)throw new InvalidArgumentException('Authenticated user required.');return (int)$raw; }
                /** @param array<string,mixed> $values @return array<string,bool> */
                private function privacy(array $values): array { $out=[];foreach(['email','displayName','publicNickname','phone','address','birthday','gender'] as $field)$out[$field]=($values[$field]??false)===true;return $out; }
            };
        },
    ],
    'migrations' => [[
        'key' => '2026_09_11_0001_profile_gender', 'version' => '1.0.0',
        'up' => ["ALTER TABLE user_profiles ADD COLUMN gender VARCHAR(32) NOT NULL DEFAULT 'unspecified' AFTER birthday", "ALTER TABLE user_profiles ADD COLUMN avatar_data MEDIUMTEXT NULL AFTER gender"],
        'down' => ['ALTER TABLE user_profiles DROP COLUMN avatar_data', 'ALTER TABLE user_profiles DROP COLUMN gender'],
    ]],
];
