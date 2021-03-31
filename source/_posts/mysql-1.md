---
title: mysql执行流程
tags:
  - mysql
date: 2021-03-24 08:54:59
top:
---

### 基本流程

![image-20210325191751923](https://gitee.com/flow_disaster/blog-map-bed/raw/master/img/image-20210325191751923.png)

上图就是mysql的基本流程

#### 解析器

这个解析器的功能，其实很好理解，就是用来识别关键字的，比如常见的select delete create等等，同时也要检查你写的sql语句语法是否有问题，有问题的就是直接返回

#### 优化器

简单理解，就是

#### 执行器

经过前面两个步骤之后，到这里mysql才真正开始执行你写的sql语句，但是它其实就是把命令传输给mysql的引擎了而已，真正执行还是要靠mysql不同的存储引擎，现在mysql默认使用的都是innodb引擎

#### innodb引擎

引擎执行sql语句的时候，也并不是直接去磁盘中查找的，而是要先在缓存中进行查找，在缓存中找不到的话，才会从磁盘中将数据加载到缓存中，然后从缓存中读取

这个缓存层，在mysql中人们习惯称之为buffer pool

#### Buffer Pool

![image-20210328085710305](https://gitee.com/flow_disaster/blog-map-bed/raw/master/img/image-20210328085710305.png)

上图其实就是buffer pool的执行流程

1. 首先是判断数据是否在buffer pool中，如果在的话，直接更新数据，如果不在，则直接去磁盘中请求相应数据，然后刷入到buffer pool中，再从buffer pool中读取
2. 更新undolog到磁盘中，undolog的作用其实非常清楚，它主要是用于回滚事务的，比如你这个事务没有执行成功，它就依靠undolog来进行回滚
3. 将更新数据的操作写入到redolog buffer中
4. 将更新数据的操作写入到binlog中
5. 提交redolog的commit，将redolog写入到os cache中，然后根据redolog的参数来决定os cache的刷盘策略

##### redolog

作用：主要用来出现意外情况，数据还在内存当中，但是机器宕机的场景

redo log里本质上记录的就是在对某个表空间的某个数据页的某个偏移量的地方修改了

[redolog与binlog的区别](https://mp.weixin.qq.com/s/XTpoYW--6PTqotcC8tpF2A)

redolog 在缓存中叫做redolog buffer，在磁盘中叫做 redolog file。

> redologbuffer 默认为16MB

两段式提交，数据刷新到内存，然后刷新到redolog buffer上，此时redolog是处于prepare阶段，然后mysql将数据刷新到binlog上，binlog写入成功之后，提交给redolog一个commit，此时redolog才算刚刚结束，接着要把redolog buffer刷入到os cache中，然后根据redolog的参数来决定os cache的刷盘策略

> redolog buffer刷新到磁盘中是有方法的，在redolog buffer没有写满的时候，采用追加写的方式，当redolog buffer 写满的时候，

了解了redo log的写入方式之后，我们发现主要完成的操作是redo log buffer 到磁盘的redo log file的写入过程，其中需要经过OS buffer进行中转。关于redo log buffer写入redo log file的时机，可以通过 参数innodb_flush_log_at_trx_commit 进行配置，各参数值含义如下：

- l参数为0的时候，称为“延迟写”。事务提交时不会将redo log buffer中日志写入到OS buffer，而是每秒写入OS buffer并调用写入到redo log file中。换句话说，这种方式每秒会发起写入磁盘的操作，假设系统崩溃，只会丢失1秒钟的数据。

- l参数为1 的时候，称为“实时写，实时刷”。事务每次提交都会将redo log buffer中的日志写入OS buffer并保存到redo log file中。其有点是，即使系统崩溃也不会丢失任何数据，缺点也很明显就是每次事务提交都要进行磁盘操作，性能较差。

- l参数为2的时候，称为“实时写，延迟刷”。每次事务提交写入到OS buffer，然后是每秒将日志写入到redo log file。这样性能会好点，缺点是在系统崩溃的时候会丢失1秒中的事务数据。

###### 结构

日志类型（就是类似MLOG_1BYTE之类的），表空间ID，数据页号，数据页中的偏移量，具体修改的数据

redo log就划分为了不同的类型，MLOG_1BYTE类型的日志指的就是修改了1个字节的值，MLOG_2BYTE类型的日志指的就是修改了2个字节的值，以此类推，还有修改了4个字节的值的日志类型，修改了8个字节的值的日志类型。

当然，如果你要是一下子修改了一大串的值，类型就是MLOG_WRITE_STRING，就是代表你一下子在那个数据页的某个偏移量的位置插入或者修改了一大串的值。

MLOG_WRITE_STRING类型的日志，因为不知道具体修改了多少字节的数据，所以其实会多一个修改数据长度，就告诉你他这次修改了多少字节的数据，如下所示他的格式：

日志类型（就是类似MLOG_1BYTE之类的），表空间ID，数据页号，数据页中的偏移量，修改数据长度，具体修改的数据

###### 组成

redolog buffer里面有很多条数据，那它刷新到磁盘的时候，总不可能一条数据一条数据刷吧，那样性能就太差了，所以说有了redolog block这个数据结构

redolog block中存放了许多个单行日志，刷新到磁盘按照redolog block来刷新

> 一个block最多放496个自己的redo log日志
>
> ，一个redolog block 是512字节，这个redolog block的512字节分成三个部分
>
> 1. 12字节的header快头
>    - 4个字节的block no，块的唯一编号
>    - 2个字节的data length，就是block里面写入了多少字节数据
>    - 2个字节的first record group 这个是说每个事务都会有多个redo log，就是一个redolog group，即一组redo log。那么在这个block里的第一组的redolog的偏移量，就是这个两个字节存储的
>    - 4个字节的checkpoint on
> 2. 496字节的body块体
> 3. 4字节的trailer块尾

![image-20210330064652434](https://gitee.com/flow_disaster/blog-map-bed/raw/master/img/image-20210330064652434.png)

###### 事务

在进行一个事务的时候，由于一个事务要进行多个增删改查的操作，所以一般都是将这些redolog先在别的地方存放，等到都转型完毕了，就把这一组redolog写入到redolog bufer中

###### 刷盘时机

1. 如果写入redolog bufer 的日志已经占据了redolog buffer总容量的一半，就会开始刷盘
2. 一个事务提交的时候，必须把它那些redolog 所在的redolog block刷入到磁盘中去，只有这样，才可以保证事务提交之后，他提交的数据绝对不会丢失。因为redolog有日志记录，随时可以回复事务做的修改
3. 后台线程定时刷新，有一个线程每个1秒就会吧redolog buffer中的redolog block刷入到磁盘文件
4. mysql关闭的时候，redolog buffer全部刷新到磁盘中

###### 命令

```bash
#查看redolog目录
show variables like 'datadir'
#设置redolog目录
innodb_log_group_home_dir
#redolog默认为48MB，默认有两个日志文件innodb_log_files_in_group
innodb_log_file_size
```

##### binlog

作用：主要用来进行主从备份的

##### undolog

undolog这个日志主要是用来进行事务回滚的，一般只有进行数据变动的时候才会有undolog，比如update insert delete，但是select 是没有的，因为select只是获取数据，并没有对数据进行变更

比如你插入一条数据，undolog中记录的是 删除一条数据，是和你进行操作的行为是相反的

###### 结构

- 这条日志开始的问题只
- 主键的各列长度和值，主键可能是你设置的表的主键，也可能是三个字段组成的联合主键，也有可能是myslq默认添加的row_id作为主键
- 表id
- undolog日志编号
- undolog日志类型 ，比如 insert语句的undolog的日志类型是 TRX_UNDO_INSERT_REC
- 这条日志的结束位置

##### 区别

1. redo log 是 InnoDB 引擎特有的；binlog 是 MySQL 的 Server 层实现的，所有引擎都可以使用。
2. redo log 是物理日志，记录的是“在某个数据页上做了什么修改”；binlog 是逻辑日志，记录的是这个语句的原始逻辑，比如“给 ID=2 这一行的 c 字段加 1 ”
3. redo log 是循环写的，空间固定会用完；binlog 是可以追加写入的。“追加写”是指 binlog 文件写到一定大小后会切换到下一个，并不会覆盖以前的日志。

### 磁盘文件

磁盘文件有三个层级

1. 一组数据组，是256个数据区
2. 一个数据区，是64个数据页
3. 一个数据页，是16kb

在磁盘中把一页的数据叫做数据页，在缓存中，称之为缓存页

