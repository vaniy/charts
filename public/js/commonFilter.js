//通用的一些公共过滤器

    var commonApp = angular.module('commonApp', []);
    //JSON序列化日期到前端的处理
    commonApp.filter("dateFilter",
                  function () {
                      return function (x) {
                          if (null == x) {
                              return null;
                          } else {
                              return new Date(parseInt(x.substr(6)));
                          }
                      };
                  });

    /*
    //根据日期转化成礼拜 
    //prefix:自定义前缀（比如：星期 周）
    */
    commonApp.filter("ToWeakDay",
                function () {
                    return function (x, prefix) {
                        var dicWeekDay = { 0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' };
                        var weekday;
                        if (null == x) {
                            return null;
                        } else {
                            var date = new Date(parseInt(x.substr(6)));
                            var i=date.getDay();
                            weekday = dicWeekDay[i];
                        }

                        return weekday == "" ? "" : ((prefix||'星期') + weekday);
                    };
                });


    /*
    //字符串过长截取处理 
    //value：需要截取的字符串 
    //wordwise:true的话只对文字进行统计，忽略标点符号（. , ：) 
    //max:截取的最大长度  
    // tail:超出最大尾部显示的效果（比如"...")
    */
    commonApp.filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';
            value = value.replace(/<\/?.+?>/g, "");//忽略编码
            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    //Also remove . and , so its gives a cleaner result.
                    if (value.charAt(lastspace - 1) == ',' || value.charAt(lastspace - 1) == '：' || value.charAt(lastspace - 1) == '.') {
                        lastspace = lastspace - 1;
                    }
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' ...');
        };
    });





    /*
    //根据国家名称对应拼音样式（供转换为国家图片样式使用）
    */
    commonApp.filter('NationToPY', function () {
        return function(nation) {
            var nationArray = { '美国': 'meiguo', '意大利': 'yidali', '法国': 'faguo', '德国': 'deguo', '英国': 'yingguo', '欧元区': 'ouzhou', '加拿大': 'jianada', '澳大利亚': 'aozhou', '中国': 'zhongguo', '新西兰': 'xinxilan', '新加坡': 'xinjiapo', '香港': 'xianggang', '瑞士': 'ruishi', '日本': 'riben', '韩国': 'hanguo', '台湾': 'taiwan' };
            if (nation == null | nation == undefined | nation == '') {
                return "";
            } else {
                var nationPY = nationArray[nation];
                return nationPY == undefined ? "" : nationPY;
            }
        }
       
    });

    /**
     *过滤html内容输出纯文本
     */
    commonApp.filter('htmlToPlaintext', function() {
        return function(text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    });


