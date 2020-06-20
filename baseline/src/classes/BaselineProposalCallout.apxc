// Dapps Incorporated 2020. All Rights Reserved.

public with sharing class BaselineProposalCallout {
    
    // Set Named Credential
 	private static final String requestURL = 'callout:dapps__Ethereum_Mainnet' + '/api/Propsosal';
    
    
    @InvocableMethod(label='Post Proposal to Baseline')
    public static void postToBaseline(List<ProposalWrapper> proposals) {
        ProposalWrapper p = proposals[0];
        Map<String,Object> msg = new Map<String,Object>();
        msg.put('rfqCaseId', p.rfqCaseId);
        msg.put('purchQty', p.purchQty);
        msg.put('purchUnit', p.purchUnit);
        msg.put('purchPrice', p.purchPrice);
        msg.put('lineNum', p.lineNum);
        String body = JSON.serialize(msg);    
        System.enqueueJob(new QueueableBaselineCall(requestURL, 'POST', body));
    }
     
    public class QueueableBaselineCall implements System.Queueable, Database.AllowsCallouts {
         
        private final String url;
        private final String method;
        private final String body;
        
        public QueueableBaselineCall(String url, String method, String body) {
            this.url = url;
            this.method = method;
            this.body = body;
        }
         
        public void execute(System.QueueableContext ctx) {
            Http h = new Http();
            HttpRequest req = new HttpRequest();
            req.setHeader('Content-Type', 'application/json;charset=UTF-8');
            req.setEndpoint(url);
            req.setMethod(method);
            req.setBody(body);
            Http http = new Http();
            HttpResponse res = http.send(req);
        }
 
    }

}