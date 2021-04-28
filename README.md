# weForward前端基础项目(基于vue 2.xx）

## 运行项目

```bash
npm run dev
```

## 编译项目并提交到生产环境

```bash
npm run buildpublish
```

## 编译项目并提交到测试环境

```bash
npm run buildtest
```

## 仅编译项目

```bash
npm run build
```


## 环境变量配置

```bash

#项目编译后提交的路径
VUE_APP_PUBLICPATH=

#编译并提交项目需要鉴权，内容格式为"用户名:密码"
VUE_APP_PUBLIC_AUTHORIZATION=

#编译阶段用的路径名（建议不要修改）
VUE_APP_TEM_BUILDPATHNAME=HONINTECHBUILDPATH
#生产环境域名，多个时使用英文逗号隔开
VUE_APP_WF_HOST_PRODUCT=
#本地环境域名
VUE_APP_WF_HOST_TEST=
#本机开发环境域名
VUE_APP_WF_HOST_DEV=//lhoninyun.navboy.com


#本开发环境默认端口
VUE_APP_WF_HOST_PORT=8088
#开发环境】服务名映射键值对模式，键值之间使用英文冒号隔开（属性名和值相同时可以只写属性名例如train等同于train:train），有多对值时使用英文冒号隔开
VUE_APP_DEV_SERVICENAME=train
```

