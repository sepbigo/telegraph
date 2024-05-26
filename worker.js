// 在代码开始的地方配置域名
const domain = 'example.com';

// 监听 fetch 事件
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 处理请求的函数
async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  if (pathname === '/') {
    return handleRootRequest();
  } else if (pathname === '/upload' && request.method === 'POST') {
    return handleUploadRequest(request);
  } else {
    // 构建新的请求 URL
    const url = new URL(request.url);
    url.hostname = 'telegra.ph';

    // 发起原始请求并返回响应
    return fetch(url, request);
  }
}

// 处理根路径请求的函数
function handleRootRequest() {
  const html = 
  `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover">
    <meta name="description" content="基于Cloudflare Workers的图床服务">
    <meta name="keywords" content="Workers图床, Cloudflare, Workers, JIASU.IN, 图床">
    <title>JIASU.IN-基于Workers的图床服务</title>
    <link rel="icon" href="https://p1.meituan.net/csc/c195ee91001e783f39f41ffffbbcbd484286.ico" type="image/x-icon">
    <!-- Twitter Bootstrap CSS -->
    <link href="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/twitter-bootstrap/4.6.1/css/bootstrap.min.css" type="text/css" rel="stylesheet" />
    <!-- Bootstrap FileInput CSS -->
    <link href="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-fileinput/5.2.7/css/fileinput.min.css" type="text/css" rel="stylesheet" />
    <!-- Toastr CSS -->
    <link href="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/toastr.js/2.1.4/toastr.min.css" type="text/css" rel="stylesheet" />
    <!-- jQuery -->
    <script src="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.min.js" type="application/javascript"></script>
    <!-- Bootstrap FileInput JS -->
    <script src="https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-fileinput/5.2.7/js/fileinput.min.js" type="application/javascript"></script>
    <!-- Bootstrap FileInput Chinese Locale JS -->
    <script src="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-fileinput/5.2.7/js/locales/zh.min.js" type="application/javascript"></script>
    <!-- Toastr JS -->
    <script src="https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/toastr.js/2.1.4/toastr.min.js" type="application/javascript"></script> 
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Long+Cang&display=swap');
    
    .title {
      font-family: "Long Cang", cursive;
      font-weight: 400;
      font-style: normal;
      font-size: 2em; /* 调整字体大小 */
      text-align: center;
      margin-top: 20px; /* 调整距离顶部的距离 */
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); /* 添加阴影效果 */
    }
    </style>
    </head> 
    <body>
    <div class="card">
    <div class="title">JIASU.IN</div>
    <div class="card-body">
        <!-- 表单 -->
        <form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
            <!-- 接口选择下拉菜单 -->
            <div class="form-group mb-3">
                <select class="custom-select" id="interfaceSelector" name="interface">
                <option value="tg">tg</option>
                </select>
            </div>
            <!-- 文件选择 -->
            <div class="form-group mb-3">
            <input id="fileInput" name="file" type="file" class="form-control-file" data-browse-on-zone-click="true">
            </div>            
            <!-- 添加按钮组 -->
            <div class="form-group mb-3" style="display: none;"> <!-- 初始隐藏 -->
                <button type="button" class="btn btn-light mr-2" id="urlBtn">URL</button>
                <button type="button" class="btn btn-light mr-2" id="bbcodeBtn">BBCode</button>
                <button type="button" class="btn btn-light" id="markdownBtn">Markdown</button>
            </div>
            <!-- 文件链接文本框 -->
            <div class="form-group mb-3" style="display: none;"> <!-- 初始隐藏 -->
                <textarea class="form-control" id="fileLink" readonly></textarea>
            </div>
            <!-- 上传中的提示 -->
            <div id="uploadingText" style="display: none; text-align: center;">文件上传中...</div>          
        </form>
    </div>
    <p style="font-size: 14px; text-align: center;">
    项目开源于 GitHub - <a href="https://github.com/0-RTT/telegraph" target="_blank" rel="noopener noreferrer">0-RTT/telegraph</a>
    </p>   
</div>
<script>
$(document).ready(function() {
  let originalImageURL = '';

  // 初始化文件输入框
  initFileInput();

  // 初始化文件输入框
  function initFileInput() {
    $("#fileInput").fileinput({
      theme:'fa',
      language:'zh',
      dropZoneEnabled:true,
      browseOnZoneClick:true,
      dropZoneTitle:"拖拽文件到这里...",
      dropZoneClickTitle:"",
      browseClass:"btn btn-light",
      uploadClass:"btn btn-light",
      removeClass:"btn btn-light",
      showUpload:false,
      layoutTemplates:{
        actionZoom:'',
      },
    }).on('filebatchselected',handleFileSelection)
      .on('fileclear',handleFileClear);
  }

  // 处理文件选择事件
  async function handleFileSelection() {
    const selectedInterface = $('#interfaceSelector').val();
    const file = $('#fileInput')[0].files[0];

    // 检查GIF文件大小
    if ((selectedInterface === 'tg') && file && file.type === 'image/gif' && file.size > 5 * 1024 * 1024) {
      toastr.error('GIF 文件必须≤5MB');
      return;
    }

    // 如果是GIF文件，显示文件链接
    if (file.type === 'image/gif') {
      originalImageURL = URL.createObjectURL(file);
      $('#fileLink').val(originalImageURL);
      $('.form-group').show();
      adjustTextareaHeight($('#fileLink')[0]);
      return;
    }

    // 如果是其他类型的图片文件，压缩图片并上传
    const compressedFile = await compressImage(file);

    try {
      $('#uploadingText').show();
      const formData = new FormData($('#uploadForm')[0]);
      formData.set('file',compressedFile,compressedFile.name);
      const uploadResponse = await fetch('/upload',{method:'POST',body:formData});
      originalImageURL = await handleUploadResponse(uploadResponse);
      $('#fileLink').val(originalImageURL);
      $('.form-group').show();
      adjustTextareaHeight($('#fileLink')[0]);
    } catch (error) {
      console.error('上传文件时出现错误:',error);
      $('#fileLink').val('文件上传失败！');
    } finally {
      $('#uploadingText').hide();
    }
  }

  // 处理上传响应
  async function handleUploadResponse(response) {
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      return '文件上传失败！';
    }
  }

  // 处理文件清除事件
  function handleFileClear(event) {
    $('#fileLink').val('');
    adjustTextareaHeight($('#fileLink')[0]);
    hideButtonsAndTextarea();
  }

  // 改变接口选择时更新文件类型
  $('#interfaceSelector').change(function() {
    const selectedInterface = $(this).val();
    let acceptTypes = '';
  
    switch (selectedInterface) {
      case 'tg':
        acceptTypes = 'image/gif,image/jpeg,image/png';
        break;
    }
    $('#fileInput').attr('accept',acceptTypes);
  }).trigger('change');

  // 点击复制按钮时处理文件链接
  $('#urlBtn,#bbcodeBtn,#markdownBtn').on('click',function() {
    const fileLink = originalImageURL.trim();
    if (fileLink !== '') {
      let formattedLink;
      switch ($(this).attr('id')) {
        case 'urlBtn':
          formattedLink = fileLink;
          break;
        case 'bbcodeBtn':
          formattedLink = '[img]' + fileLink + '[/img]';
          break;
        case 'markdownBtn':
          formattedLink = '![image](' + fileLink + ')';
          break;
        default:
          formattedLink = fileLink;
      }
      $('#fileLink').val(formattedLink);
      adjustTextareaHeight($('#fileLink')[0]);
      copyToClipboardWithToastr(formattedLink);
    }
  });

  // 调整文本区域高度
  function adjustTextareaHeight(textarea) {
    textarea.style.height = '1px';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }

  // 使用Toastr复制到剪贴板
  function copyToClipboardWithToastr(text) {
    const input = document.createElement('input');
    input.setAttribute('value',text);
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);

    toastr.success('已复制到剪贴板','', { timeOut: 300 });
  }

  // 隐藏按钮和文本区域
  function hideButtonsAndTextarea() {
    $('#urlBtn,#bbcodeBtn,#markdownBtn,#fileLink').parent('.form-group').hide();
  }

  // 图片压缩函数
  function compressImage(file) {
    return new Promise((resolve) => {
      const quality = 0.6;
      const reader = new FileReader();
      reader.onload = ({ target: { result: src } }) => {
        const image = new Image();
        image.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image,0,0,image.width,image.height);
          const compressedDataURL = canvas.toDataURL('image/jpeg',quality);
          const blob = await fetch(compressedDataURL).then(res => res.blob());
          const compressedFile = new File([blob],file.name, { type: 'image/jpeg' });
          resolve(compressedFile);
        };
        image.src = src;
      };
      reader.readAsDataURL(file);
    });
  }
});
</script>
  
</body>
</html>
  `;

// 返回 HTML 内容，并设置响应头为 UTF-8 编码
return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

// 接口配置对象，包含各平台的上传配置
  const interfaceConfigs = {
    tg: {
      uploadURL: 'https://telegra.ph/upload',
      prepareFormData: async function(file, formData) {
        const uploadHeaders = {};
        return {
          url: this.uploadURL,
          headers: uploadHeaders,
          body: formData
        };
      }
    }
  };

// 处理上传请求的函数  
  async function handleUploadRequest(request) {
    try {
      const formData = await request.formData();
      const selectedInterface = formData.get('interface');
      const file = formData.get('file');
  
      if (!selectedInterface || !file) {
        throw new Error('Missing interface or file');
      }
  
      const config = interfaceConfigs[selectedInterface];
      if (!config) {
        throw new Error('Interface configuration not found');
      }
  
      const preparedFormData = await config.prepareFormData(file, formData);
      const response = await fetch(preparedFormData.url, {
        method: 'POST',
        headers: preparedFormData.headers,
        body: preparedFormData.body
      });
  
      if (!response.ok) {
        throw new Error('Upload Failed');
      }
  
      const responseData = await response.json();
      const imageURL = getImageURL(selectedInterface, responseData);
  
      const jsonResponse = { data: imageURL };
      return new Response(JSON.stringify(jsonResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Internal Server Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
  
// 获取图片链接的函数  
  function getImageURL(selectedInterface, responseData) {
    let url;
  
    switch (selectedInterface) {
      case 'tg':
        url = `https://${domain}${responseData[0].src}`;
        break;
      default:
        throw new Error('Unexpected response format');
    }
    
    return url;
  }
  
