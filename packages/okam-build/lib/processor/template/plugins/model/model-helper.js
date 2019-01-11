/**
 * @file model-helper
 * @author xiaohong8023@outlook.com
 */

const EVENT_FN_NAME = '__handlerProxy';

/**
 * 是否已声明某属性
 *
 * @param  {string}  name  name
 * @param  {Array}  attrs attrs
 * @return {boolean}      true or false
 */
function hasAttr(name, attrs) {
    return (attrs[name] || attrs[`:${name}`]);
}

// <input v-model="inputVal" />
// =>
// <input
//      Xinput="__handlerProxy"
//      value="{{inputVal}}" />
//
// <input v-model="inputVal" bindinput="self"/>
// =>
// <input
//      Xinput="__handlerProxy"
//      data-input-proxy="self"
//      value="{{inputVal}}" />
exports.modelTransformer = function (attrs, name, tplOpts, opts, element) {
    const {logger, file} = tplOpts;
    const {customComponentTags: customTags, modelMap} = opts;
    let isCustomTag = customTags && customTags.includes(element.name);
    let attrMap = isCustomTag
        ? (modelMap[element.name] || modelMap.default)
        : modelMap[element.name];
    if (!attrMap) {
        return;
    }

    let {eventName, eventType, attrName, detailName} = attrMap;
    let oldEvent = attrs[eventName];

    let isOrigin = oldEvent && (attrs[eventName] !== EVENT_FN_NAME);

    // 没有函数 或者 有函数， 不是 __handlerProxy 需要添加函数属性
    // 不是 __handlerProxy 说明时原生写法
    if (!oldEvent || isOrigin) {
        attrs[eventName] = EVENT_FN_NAME;
    }

    // 此时已处理，主要考虑原生写法
    // 有函数 且不是 __handlerProxy 需要添加函数属性
    if (isOrigin) {
        attrs[`data-${eventType}-proxy`] = oldEvent;
    }

    if (attrName) {
        if (hasAttr(attrName, attrs)) {
            logger.warn(
                `${file.path} template attribute 「v-model="${attrs[name]}"」`,
                `is conflicted with 「${attrName}」on element <${element.name}>`
            );
        }
        attrs[attrName] = '{{' + attrs[name] + '}}';
    }

    // '数据表达式,事件值'
    let modelVal = attrs[name];
    detailName && (modelVal += `,${detailName}`);
    attrs['data-okam-model-args'] = modelVal;
    delete attrs[name];
};
