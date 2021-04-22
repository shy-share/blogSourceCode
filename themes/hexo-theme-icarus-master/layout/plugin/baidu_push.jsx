const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

class BaiduPush extends Component {
    render() {
        const { jsUrl } = this.props;

        return <Fragment>
            <script src={jsUrl} defer={true}></script>
        </Fragment>;

    }
}

BaiduPush.Cacheable = cacheComponent(BaiduPush, 'plugin.baiduPush', props => {
    const { helper, head, page } = props;
	const {full_url_for} = helper;
	
    if (!head) {
        return null;
    }
	var curProtocol = full_url_for(page.path).split(':')[0];
    return {
        jsUrl: curProtocol === 'https' ? 'https://zz.bdstatic.com/linksubmit/push.js' : 'http://push.zhanzhang.baidu.com/push.js'
    };
});

module.exports = BaiduPush;