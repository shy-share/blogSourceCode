---
title: {{ title }}
date: {{ date }}
tags:
  -
#默认显示目录
toc: true
#自定义摘要
excerpt：
#加密的时候这个 为-1
top:
# recommend值（必须大于0），值越大越靠前，相等取最新的，最多取5条
recommend： 
#以下为文章加密信息，加密文章不会出现在最新文章列表widget中，也不会出现在文章中推荐列表中，首页列表中需要设置top: -1 让它排在最后比较合理一些
encrypt: true
password: 123456 #此处为文章密码
abstract: 咦，这是一篇加密文章，好像需要输入密码才能查看呢！
message: 嗨，请准确无误地输入密码查看哟！
wrong_pass_message: 不好意思，密码没对哦，在检查检查呢！
wrong_hash_message: 不好意思，信息无法验证！
---

