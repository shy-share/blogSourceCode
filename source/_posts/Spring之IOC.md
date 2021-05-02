---
title: Spring之IOC
tags:
  - spring
toc: true
date: 2021-05-02 10:48:28
---

详细介绍Spring的IOC

 <!-- more -->

## IOC

beans和context两个包是IOC的基础，BeanFactory接口提供了管理bean的机制，而 ApplicationContext是BeanFactory的一个子接口，它增加了AOP的整合，资源国际化，事件发布，以及应用层的context，比如WebApplicationContext。

简单点的说，BeanFactory提供了配置框架和基本功能，ApplicationContext增加了企业开发需要的特性，Spring的IOC容器一般也就是指ApplicationContext。

### Bean

bean的标识符必须唯一，一般情况下只有一个标识符，但可以有多个名称

在xml配置中，id, name 都是指的标识符，bean可以定义多个名称，在name属性中指定(逗号，分号或者空格分隔多个别名)

> 如果一个bean没有定义ID，则将会以它的simple name作为名字(首字母小写，如果多个大写字母开头，则保持原样)

```xml
<alias name="fromName" alias="toName"/>
```



