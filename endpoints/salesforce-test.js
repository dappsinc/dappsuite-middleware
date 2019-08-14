function querySObjectForTotal(query, oauth) {
    

    orgProduction.query({query: query, oauth: oauth}, function (err, res) {
        if (err) return console.error(err);
        else {
            console.log("####res", res);
            //callback(res.records, session, next);
        }
    });
}
let tempOauth = { access_token: 'SycLE6P3rmOUlbHqL2VcgkSyymM26vrX94vdPD4m92NjHiAAbwV1R_M_9dbvLAsKZ6xeFfTvRMyihBASWN2tixA',
  refresh_token: '5Aep8613hy0tHCYdhyvfTpyrLO.peX9p0zFoVGR8zuPKbvzSYS4.bnnpw_6PFjbT9pBy8rllnDdVD7CgGuqgMX2',
  signature: 'wFMVb99FyD3MiYti4ejrnZYpcrKhxVxcHn6tCD59J0w=',
  scope: 'refresh_token chatter_api api id',
  instance_url: 'https://ap5.salesforce.com',
  id: 'https://login.salesforce.com/id/00D7F000001Yvo8UAC/0057F000001QtGQQA0',
  token_type: 'Bearer',
  issued_at: '1502095170865' };

  let tempOauth1 = { access_token: 'SycLE6P3rmOUlbHqL2VcgkSyymM26vrX94vdPD4m92NjHiAAbwV1R_M_9dbvLAsKZ6xeFfTvRMyihBASWN2tixA',
  refresh_token: '5Aep8613hy0tHCYdhyvfTpyrLO.peX9p0zFoVGR8zuPKbvzSYS4.bnnpw_6PFjbT9pBy8rllnDdVD7CgGuqgMX2',
  signature: 'wFMVb99FyD3MiYti4ejrnZYpcrKhxVxcHn6tCD59J0w=',
  scope: 'refresh_token chatter_api api id',
  instance_url: 'https://ap5.salesforce.com',
  id: 'https://login.salesforce.com/id/00D7F000001Yvo8UAC/0057F000001QtGQQA0',
  token_type: 'Bearer',
  issued_at: '1502095170865' };

//in database
00D7F000001Yvo8!AQQAQPVLpceqDmgo49Mh1Q8Az8E1Sj0iP3XNVcP34I8zK8Q5Spu9dHqinXPTLm4QxoRMc7iwCjEAsatPuO6VXcY1AcCp1uwt
let tempOauth3 ={ access_token: '123',
  refresh_token: '5Aep8613hy0tHCYdhyvfTpyrLO.peX9p0zFoVGR8zuPKbvzSYSAsbzqYgU5bYAAxTAcNO49o1CqZAKZeO_q5rqi',
  signature: 'C1gCQZe2RczLo14pYCHV7ko2QOmY2WOT2GHC5rPxSNM=',
  scope: 'refresh_token chatter_api api id',
  instance_url: 'https://ap5.salesforce.com',
  id: 'https://login.salesforce.com/id/00D7F000001Yvo8UAC/0057F000001QtGQQA0',
  token_type: 'Bearer',
  issued_at: '1502115603701' }

  

querySObjectForTotal("select id from account limit 3", tempOauth);
querySObjectForTotal("select id from account limit 10", tempOauth1);
querySObjectForTotal("select id from account limit 10", tempOauth3);



{ Error: invalid_grant - expired access/refresh token
    at Request._callback (/home/xmachine/workarea/eth/dapps-nodeserver-dev/node_modules/nforce/index.js:865:15)
    at Request.self.callback (/home/xmachine/workarea/eth/dapps-nodeserver-dev/node_modules/request/request.js:188:22)
    at emitTwo (events.js:106:13)
    at Request.emit (events.js:194:7)
    at Request.<anonymous> (/home/xmachine/workarea/eth/dapps-nodeserver-dev/node_modules/request/request.js:1171:10)
    at emitOne (events.js:96

