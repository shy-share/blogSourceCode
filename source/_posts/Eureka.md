---
 Eureka
tags:
  - SpringCloud
ttrue
date: 2021-05-20 10:39:11
---

原理讲解

<!-- more -->

，Eureka 还有⼀个⼼跳机制，各个 Eureka Client 每隔 30 秒会发送⼀次⼼跳到 Eureka Server

Eureka Client 会每隔 30 秒去找 Eureka Server 拉取最近注册表的变化，看 看其他服务的地址有没有变化。

Eureka Server 的注册表直接基于纯内存，即在内存⾥维护了⼀个CocurrentHashMap