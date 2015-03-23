# AnimationEngine
开源的HTML动画引擎。

# 介绍
基于描述式的使用方式，以后会加入可视化设计器实现所见即所得。
当前仅为概念验证阶段，效果仅包含间断、连续、颜色渐变。
已支持预渲染帧序列。

# 兼容性
目前的兼容性问题为IE8及以下不支持自定义标签的children属性。
解决方案：
使用div标签，然后使用name/type标识类型 或 使用JSON方式提供数据源。

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
- div标签，name/type标识类型，兼容
- JSON数据源
- 扩充效果
- 设计器

# License
MIT