"""Example local validation server. No authentication or persistence."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
NAME = re.compile(r'[A-Za-z][A-Za-z0-9_]{0,63}\Z')


def validate(schema, values):
    if not isinstance(schema,dict) or set(schema)-{'type','title','properties','required'} or schema.get('type')!='object': raise ValueError('Hanya schema object sederhana yang didukung.')
    if 'title' in schema and (not isinstance(schema['title'],str) or len(schema['title'])>100): raise ValueError('Judul tidak valid.')
    props=schema.get('properties'); required=schema.get('required',[])
    if not isinstance(props,dict) or not 1<=len(props)<=20 or not isinstance(required,list) or any(not isinstance(x,str) or x not in props for x in required) or len(set(required))!=len(required): raise ValueError('Properties atau required tidak valid.')
    for name,spec in props.items():
        if not isinstance(name,str) or not NAME.fullmatch(name) or not isinstance(spec,dict) or set(spec)-{'type','title','enum'} or spec.get('type') not in ('string','number'): raise ValueError('Field tidak didukung.')
        if 'title' in spec and (not isinstance(spec['title'],str) or not spec['title'].strip() or len(spec['title'])>100): raise ValueError('Judul field tidak valid.')
        if 'enum' in spec:
            options=spec['enum']
            if spec['type']!='string' or not isinstance(options,list) or not 1<=len(options)<=30 or any(not isinstance(x,str) or not x or len(x)>100 for x in options) or len(set(options))!=len(options): raise ValueError('Enum tidak valid.')
    if not isinstance(values,dict): raise ValueError('Hasil harus object.')
    errors=[]
    for key in values:
        if key not in props: errors.append(f'Field tidak dikenal: {key}')
    for key,spec in props.items():
        value=values.get(key,'')
        if value=='':
            if key in required: errors.append(f'{key} wajib diisi.')
            continue
        if spec['type']=='number' and (type(value) not in (int,float) or not math.isfinite(value)): errors.append(f'{key} harus angka.')
        if spec['type']=='string' and (not isinstance(value,str) or len(value)>1000): errors.append(f'{key} harus teks maksimal 1000 karakter.')
        elif 'enum' in spec and value not in spec['enum']: errors.append(f'{key} bukan pilihan yang tersedia.')
    return errors


class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args): pass
    def do_POST(self):
        self.close_connection=True
        try:
            if self.path!='/validate': raise ValueError('Route tidak ditemukan.')
            if self.headers.get_all('Content-Type',[])!=['application/json'] or self.headers.get_all('Transfer-Encoding',[]): raise ValueError('Gunakan application/json tanpa chunked.')
            lengths=self.headers.get_all('Content-Length',[])
            if len(lengths)!=1 or not re.fullmatch(r'[0-9]{1,5}',lengths[0]) or not 1<=int(lengths[0])<=32768: raise ValueError('Ukuran request tidak valid.')
            self.connection.settimeout(3)
            raw=self.rfile.read(int(lengths[0])); data=json.loads(raw.decode('utf-8'))
            if not isinstance(data,dict) or set(data)!={'schema','values'}: raise ValueError('Kirim schema dan values.')
            errors=validate(data['schema'],data['values']); status=200 if not errors else 400; result={'valid':not errors,'errors':errors}
        except (ValueError, UnicodeError, OSError, RecursionError, OverflowError):
            status=400; result={'valid':False,'errors':['Request atau schema tidak valid.']}
        body=json.dumps(result,ensure_ascii=True).encode('utf-8')
        try:
            self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(body))); self.send_header('Connection','close'); self.end_headers(); self.wfile.write(body)
        except OSError: pass


def main():
    p=argparse.ArgumentParser(); p.add_argument('--port',type=int,default=8769); a=p.parse_args()
    if not 1<=a.port<=65535: p.error('Port harus 1–65535.')
    try:
        server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler)
        print(f'Buka http://127.0.0.1:{a.port}/',flush=True)
        try: server.serve_forever()
        finally: server.server_close()
    except KeyboardInterrupt: return 130
    except OSError: print('Port lokal tidak tersedia.',file=sys.stderr); return 2
    return 0


if __name__=='__main__': raise SystemExit(main())
