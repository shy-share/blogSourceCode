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

Eureka Client**分为服务提供者和服务消费者**，但是某服务**既是服务提供者又是服务消费者**。

- Eureka Server(服务注册中心)：

- - **失效剔除：**默认每隔一段时间（默认为60秒） 将当前清单中超时（默认为90秒）**没有续约的服务剔除出去**。
  - **自我保护：**。EurekaServer 在运行期间，会统计心跳失败的比例在15分钟之内是否低于85%(通常由于网络不稳定导致)。Eureka Server会将当前的**实例注册信息保护起来**， 让这些实例不会过期，尽可能**保护这些注册信息**。

- 