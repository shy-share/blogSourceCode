---
title: mysql锁
tags:
  - mysql
date: 2021-03-31 20:47:03
top:
---

# 分类

## 表结构分类

### 行锁

默认情况下，是不需要锁的，默认是开启MVCC机制的，所以读取数据和修改数据完全不会互相影响，直接根据undolog版本链和ReadView来进行读取即可

#### 共享锁

共享锁又被称为S锁

默认查询数据不会开启共享锁的，是走mvcc机制读快照版本，但是可以手动添加

```sql
#加共享锁
select * from vpm_project lock in share mode
#查询之后还是更新，这样就给查询语句加上了独占锁
select * from vpm_project for update
```

> 生产情况下，是不会开启共享锁的，因为根据这样会造成性能下降，而且根据mvcc机制读快也可以保证数据的准确性
>
> 如果非要在查询的时候加锁，通常都是在redis/zookeeper分布式锁来控制系统的锁逻辑，因为你如果直接在数据中加上复杂业务的锁逻辑，锁逻辑会隐藏在sql语句中，这对于java来说不太好维护

#### 独占锁

默认更新数据的时候是开启的

#### 关系

![](https://gitee.com/flow_disaster/blog-map-bed/raw/master/img/image-20210331205512682.png)

> 读取数据其实就是 select
>
> 修改数据其实就是  update delete insert

### 表锁

执行DDL语句的时候，默认会加上表锁，这是通过数据库的元数据锁实现的，也就是Metadata Locks

>DDL语句和增删改操作，确实是互斥的

#### 共享锁

```sql
#加表级共享锁
lock tables 表名 read;
```

#### 独占锁

```sql
#加表级独占锁
lock tables 表名 write;
```

#### 意向共享锁

当有事务在表里执行增删改操作的时候，会默认在行级加独占锁，同时也会在表级加一个意向独占锁

#### 意向独占锁

当有事务在表里执行查询操作的时候，会默认在表级加一个意向共享锁

#### 关系

![](https://gitee.com/flow_disaster/blog-map-bed/raw/master/img/image-20210331212950511.png)

### 间隙锁

