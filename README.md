# AnimationEngine
开源的HTML动画引擎。

# 介绍
基于描述式的使用方式，以后会加入可视化设计器。
当前仅为概念验证阶段，效果仅包含间断、连续模式。

# 使用
```html
<storyboard id="demo">
    <animation target="testBox" property="margin-left" repeat="1">
        <easing time="0" value="0" suffix="px"></easing>
        <easing time="500" value="150" suffix="px"></easing>
        <easing time="1000" value="0" suffix="px"></easing>
    </animation>
</storyboard>
```

# Demo
http://zhang740.github.io/AnimationEngine/

# TODO
功能：
- JSON数据源
- 扩充效果
- 设计器

性能：
- 预渲染帧序列

# License
MIT