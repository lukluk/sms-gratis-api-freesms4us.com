var express = require('express');
var aby = require('./ocr')
var app = express();
var Nightmare = require('nightmare');
var realMouse = require('nightmare-real-mouse');
var p = require('./node_modules/nightmare-screenshot/index');
// add the plugin
realMouse(Nightmare);


app.get('/send/:number', function(req, res) {
    var nightmare = Nightmare({
        show: true
    })
    var sessid = (new Date()).getTime();
    nightmare
        .goto('http://www.freesms4us.com/')
        .inject('js', 'jq.js')
        .type('[name=penerima]','2')
        .screenshot('./.tmp/code' + sessid + '.png', {
            height: 15,
            width: 185,
            x: 194,
            y: 482
        })
        .evaluate(function(n,msg){
          jQuery('[name=penerima]').val(n)
          jQuery('#pesan').val(msg)
        },req.params.number,req.query.msg)
        .then(function() {
            aby.ocr('./.tmp/code' + sessid + '.png', function(err, result) {
                if (err) {
                    res.json({
                        error: true,
                        err: err
                    })
                    nightmare.end().then(function() {

                    })
                } else {
                    var ar = result.split('Cari ')
                    var ar1 = ar[1].trim().split(' ')
                    var startpos = 0;
                    if (ar1.length > 1) {
                        ar[1] = ar1[0]
                        ar1.splice(0, 1)
                        ar[0] = ar1.join(' ')
                        startpos = 80
                    }
                    var target = ar[1].replace(/[^0-9.]/g, '')
                    var li = ar[0].split(' ')
                    var x = startpos + (li.indexOf(target) * 20) + 5
                    nightmare.evaluate(function(x) {
                            jQuery('input[name=x]').val(x)
                            jQuery('#smsgratis').submit()
                        }, x)
                        .then(function() {
                            nightmare.wait(1000)
                                .wait('.box')
                                .evaluate(function() {
                                    return jQuery('.box').eq(1).text()
                                })
                                .end()
                                .then(function(status) {
                                    console.log('STATUS', status)
                                    var s = status.split('SILAHKAN LOGIN')
                                    res.json({success:true,status:status})
                                })
                        })

                }
            })


        })

})
app.listen(3000);
