⚠️需要网络能够访问telegraph

# 特点
图片储存在telegraph

支持上传大于5MB的图片

# 使用方法
## worker
复制worker.js代码，修改第二行example.com为你的自定义域名即可！

支持配置多接口，修改代码中的interfaceConfigs和getImageURL即可！
responseData返回的是接口的json内容

### nginx+php
下载源码，将文件上传到网站目录，访问域名即可！

配置自己的反代域名
修改nginx配置
```
location /file {
            proxy_pass https://telegra.ph/file;
}
```
修改api/api.php文件第6行中的域名即可！

### docker

```docker pull baipiaoo/telegraph:latest```

```docker run -p 8080:80 -d --restart=always baipiaoo/telegraph```

复制功能由```navigator.clipboard```实现，需使用 HTTPS 协议！
###### nginx 反代配置
```
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```    
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=0-RTT/telegraph&type=Date)](https://star-history.com/#0-RTT/telegraph&Date)
