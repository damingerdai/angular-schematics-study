# angular schematics 学习的源代码

本文用于记录学习[高效 Coding 術：Angular Schematics 實戰三十天](https://ithelp.ithome.com.tw/articles/10222385)。

## ast-demo

一个简单的typescript compiler api的demo

## font-awesome-app

一个用于实现、验证hello-world中的ng-add的schematics的例子

```
ng add ../hello-world
```

## hello-world

学习angular schematics过程中国的主要代码

## schematics-app

基于library的思路去安装schematics

## web-app

一个用于实现、验证hello-world中的hello-world的schematics的例子

```
ng generate ../hello-world/src/collection.json:hello-world feature/arthur-ming --dryRun=true

(ng generate /Users/gming001/Code/angular/schematics/hello-world/src/collection.json:hello-world feature/arthur-ming)
```

## Makefile

简化部分流程