<?php

class ImageUploader {
    private const ALLOWED_EXTENSIONS = ['gif', 'jpeg', 'jpg', 'png'];
    private const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private const MAX_RESOLUTION = 25 * 1024 * 1024; // 25MB
    private const DOMAINS = ['img.pub'];
    private const UPLOAD_URL = 'https://telegra.ph/upload';

    // 文件头部的魔术数字
    private const MAGIC_NUMBERS = [
        'image/jpeg' => "\xFF\xD8\xFF",
        'image/png' => "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A",
        'image/gif' => "GIF"
    ];

    public function upload(): void {
        try {
            $file = $this->validateFile($_FILES['file'] ?? null);
            $file = $this->checkSizeAndCompress($file);
            $imgPath = $this->uploadToServer($file);
            if (!$imgPath) {
                throw new Exception("请确保图片分辨率≤25M！");
            }
            $imageHost = 'https://' . self::DOMAINS[array_rand(self::DOMAINS)];
            $this->outputSuccess("上传成功", $imageHost . $imgPath);
        } catch (Exception $e) {
            $this->outputError($e->getMessage());
        }
    }

    private function validateFile($file): array {
        if (!$file || !isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new Exception("没有上传文件！");
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);

        if (!in_array(strtolower($fileExtension), self::ALLOWED_EXTENSIONS) || !in_array($mime, ['image/gif', 'image/jpeg', 'image/png'])) {
            throw new Exception("只允许上传 gif、jpeg、jpg、png 格式的图片文件！");
        }

        if (!$this->validateMagicNumber($file['tmp_name'], $mime)) {
            throw new Exception("文件的魔术数字与宣称的类型不匹配！");
        }

        return $file;
    }

    private function checkSizeAndCompress(array $file): array {
        // 验证文件大小是否超出限制
        if ($file['size'] > self::MAX_RESOLUTION) {
            throw new Exception("图片分辨率超过最大限制！");
        }

        if ($file['size'] > self::MAX_SIZE) {
            if ($file['type'] === 'image/gif') {
                throw new Exception("GIF 文件超过5MB，无法上传！");
            }
            return $this->compressImage($file);
        }
        return $file;
    }

    private function compressImage(array $image): array {
        $sourceImage = imagecreatefromstring(file_get_contents($image['tmp_name']));
        if ($sourceImage === false) {
            throw new Exception("图片加载失败！");
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'img');
        imagejpeg($sourceImage, $tempFile, 75);
        imagedestroy($sourceImage);

        $compressedSize = filesize($tempFile);
        if ($compressedSize > self::MAX_SIZE) {
            unlink($tempFile); // 删除压缩后的临时文件
            throw new Exception("图片压缩失败或压缩后仍超过最大限制！");
        }

        return ['name' => uniqid('', true) . '.jpg', 'type' => 'image/jpeg', 'tmp_name' => $tempFile, 'error' => 0, 'size' => $compressedSize];
    }

    private function uploadToServer(array $file): ?string {
        // 生成安全的文件名，使用 UUID
        $safeFileName = $file['name'];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::UPLOAD_URL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => new CURLFile($file['tmp_name'], $file['type'], $safeFileName)]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        unlink($file['tmp_name']); // 删除上传后的临时文件

        if ($httpStatus !== 200) {
            throw new Exception("远程服务器返回错误：HTTP $httpStatus");
        }

        $json = json_decode($response, true);
        if ($json === null || !isset($json[0]['src'])) {
            return null;
        }

        return $json[0]['src'];
    }

    private function validateMagicNumber(string $filePath, string $fileType): bool {
        // 获取文件头部的前几个字节
        $handle = fopen($filePath, 'rb');
        $fileSignature = fread($handle, 4);
        fclose($handle);

        // 检查文件的魔术数字是否与宣称的类型匹配
        if (isset(self::MAGIC_NUMBERS[$fileType])) {
            return strpos($fileSignature, self::MAGIC_NUMBERS[$fileType]) === 0;
        }

        return false;
    }

    private function outputResult(array $result): void {
        header("Content-type: application/json");
        echo json_encode($result);
        exit;
    }

    private function outputError(string $msg): void {
        $this->outputResult(["status" => "error", "message" => $msg]);
    }

    private function outputSuccess(string $msg, string $url): void {
        $this->outputResult(["status" => "success", "message" => $msg, "data" => $url]);
    }
}

$uploader = new ImageUploader();
$uploader->upload();

?>
