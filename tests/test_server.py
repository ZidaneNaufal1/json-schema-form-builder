from contextlib import contextmanager
from http.server import ThreadingHTTPServer
import json
from threading import Thread
import unittest
from urllib.error import HTTPError
from urllib.request import Request, build_opener, ProxyHandler
import server

SCHEMA={'type':'object','properties':{'name':{'type':'string'},'level':{'type':'number'},'shift':{'type':'string','enum':['Pagi','Sore']}},'required':['name','shift']}


class ValidationTests(unittest.TestCase):
    def test_valid(self): self.assertEqual(server.validate(SCHEMA,{'name':'Ada','level':2,'shift':'Pagi'}),[])
    def test_missing_wrong_type_and_enum(self): self.assertEqual(len(server.validate(SCHEMA,{'level':'2','shift':'Malam'})),3)
    def test_unsupported_schema(self):
        with self.assertRaises(ValueError): server.validate({'type':'object','properties':{'x':{'type':'object'}}},{})
    def test_unexpected_values(self): self.assertEqual(len(server.validate(SCHEMA,{'name':'Ada','shift':'Pagi','extra':1})),1)
    def test_boolean_is_not_number(self): self.assertEqual(len(server.validate(SCHEMA,{'name':'Ada','shift':'Pagi','level':True})),1)
    def test_invalid_field_name(self):
        with self.assertRaises(ValueError): server.validate({'type':'object','properties':{'bad id':{'type':'string'}}},{})

    def test_http_validation_accepts_and_rejects(self):
        instance=ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        thread=Thread(target=instance.serve_forever,daemon=True); thread.start()
        self.addCleanup(thread.join,3); self.addCleanup(instance.server_close); self.addCleanup(instance.shutdown)
        opener=build_opener(ProxyHandler({}))
        url=f'http://127.0.0.1:{instance.server_port}/validate'
        def send(values):
            body=json.dumps({'schema':SCHEMA,'values':values}).encode('utf-8')
            req=Request(url,data=body,headers={'Content-Type':'application/json'},method='POST')
            try:
                with opener.open(req,timeout=3) as response: return response.status,json.load(response)
            except HTTPError as response:
                with response: return response.code,json.load(response)
        self.assertEqual(send({'name':'Ada','shift':'Pagi'})[0],200)
        code,result=send({'name':'','shift':'Malam'})
        self.assertEqual(code,400); self.assertFalse(result['valid'])


if __name__=='__main__': unittest.main()
