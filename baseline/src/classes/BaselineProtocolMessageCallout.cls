// Dapps Incorporated 2020. All Rights Reserved.

public with sharing class BaselineProtocolMessageCallout {

 	private static final String requestURL = 'callout:dapps__Network' + '/api/dispatchProtocolMessage';
    
    @InvocableMethod(label='Post Protocol Message to Baseline')
    public static void postProtocolMessage(List<BaselineProtocolMessageWrapper> protocolMessages) {
        BaselineProtocolMessageWrapper pm = protocolMessages[0];
        Map<String,Object> msg = new Map<String,Object>();
        msg.put('opcode', pm.opcode);
        msg.put('sender', pm.sender);
        msg.put('recipient', pm.recipient);
        msg.put('shield', pm.shield);
        msg.put('identifier', pm.identifier);
        msg.put('signature', pm.signature);
        msg.put('type', pm.type);
        msg.put('payload', pm.payload);
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