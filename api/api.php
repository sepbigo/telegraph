<?php

class ImageUploader
{
    private $allowedTypes = ["image/gif", "image/jpeg", "image/jpg", "image/pjpeg", "image/x-png", "image/png"];
    private $maxSize = 5 * 1024 * 1024; // 5MB
    private $domains = ['img.selipoi.top', 'picture.atago.moe'];

    public function upload()
    {
        if (!isset($_FILES["file"])) {
            $this->outputError("没有上传文件！");
            return;
        }

        $file = $_FILES["file"]["name"];
        $fileType = $_FILES["file"]["type"];
        $fileSize = $_FILES["file"]["size"];
        $filepath = $_FILES["file"]["tmp_name"];

        if (!in_array($fileType, $this->allowedTypes)) {
            $this->outputError("只允许上传gif、jpeg、jpg、png格式的图片文件！");
            return;
        }

        if ($fileType == "image/gif" && $fileSize > $this->maxSize) {
            $this->outputError("GIF文件超过5MB，无法上传！");
            return;
        }

        if ($fileSize > $this->maxSize) {
            $compressedImage = $this->compress_image($_FILES["file"]);
            if (!$compressedImage) {
                $this->outputError("图片压缩失败或压缩后仍超过最大限制！");
                return;
            }
            $fileType = $compressedImage['type'];
            $fileSize = $compressedImage['size'];
            $filepath = $compressedImage['tmp_name'];
        }

        $imgPath = $this->upload_image($filepath, $fileType, $file);
        if ($imgPath) {
            $imageHost = 'https://' . $this->domains[array_rand($this->domains)];
            $this->outputSuccess("上传成功", $imageHost . $imgPath);
        } else {
            $this->outputError("Telegraph不支持该格式！");
        }
    }

    private function compress_image($image)
    {
        if ($image['size'] <= $this->maxSize) {
            return $image;
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'image');
        if (!$tempFile) {
            return false;
        }

        imagejpeg(imagecreatefromstring(file_get_contents($image['tmp_name'])), $tempFile, 80);
        $compressedSize = filesize($tempFile);

        if ($compressedSize <= $this->maxSize) {
            return [
                'name' => $image['name'],
                'type' => 'image/jpeg',
                'tmp_name' => $tempFile,
                'error' => 0,
                'size' => $compressedSize
            ];
        } else {
            unlink($tempFile);
            return false;
        }
    }

    private function outputResult($result)
    {
        header("Content-type: application/json");
        echo json_encode($result, JSON_UNESCAPED_UNICODE);
    }

    private function outputError($msg)
    {
        $this->outputResult(["code" => 201, "msg" => $msg]);
    }

    private function outputSuccess($msg, $url)
    {
        $this->outputResult(["code" => 200, "msg" => $msg, "url" => $url]);
    }

    private function upload_image($filepath, $fileType, $fileName)
    {
        $data = [
            'file' => curl_file_create($filepath, $fileType, $fileName)
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://telegra.ph/upload');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        $json = json_decode($response, true);
        if ($json && isset($json[0]['src'])) {
            return $json[0]['src'];
        } else {
            return false;
        }
    }
}

$uploader = new ImageUploader();
$uploader->upload();
