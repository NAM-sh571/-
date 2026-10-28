"""Run with python -m unittest tests -v (no network required)."""
import unittest
from urllib.error import HTTPError
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).parent/'scripts'))
import update_catalog as m

class Headers(dict):
    def get(self, key, default=None): return super().get(key,default)

class Tests(unittest.TestCase):
    def test_url_sanitization(self):
        self.assertEqual(m.cleaned_url('javascript:alert(1)'), '')
        self.assertEqual(m.cleaned_url('http://google.com'), '')
        self.assertEqual(m.cleaned_url('https://127.0.0.1/x'), '')
        self.assertEqual(m.cleaned_url('https://example.com/a?utm_source=x&x=4'),'https://example.com/a?x=4')
    def test_initial_monitor_is_not_changed(self):
        def f(url): return 200, Headers({'Content-Type':'application/pdf'}),b'%PDF first version',False,url
        a=m.monitor({'id':'test','name':'test','deckUrl':'https://example.com/b.pdf','deckType':'direct'}, {},'2026-10-27T00:00:00Z',f)
        self.assertEqual(a['status'],'ok')
        self.assertFalse(a['changed'])
        self.assertNotEqual(a['fingerprint'],None)
    def test_change_detected_and_not_assumed_new_release(self):
        old={'fingerprint':'old-hash','changed_at':None}
        def f(url): return 200,Headers({'Content-Type':'text/html'}),b'changed',False,url
        a=m.monitor({'id':'test','name':'test','deckUrl':'https://example.com/p','deckType':'guide'},old,'2026-10-27T00:00:00Z',f)
        self.assertEqual(a['status'],'ok')
        self.assertTrue(a['raw_changed'])
        self.assertEqual(a['change_candidates'],[])
    def test_403_not_broken_document_claim(self):
        def f(url): raise HTTPError(url,403,'forbidden',{},None)
        a=m.monitor({'id':'test','name':'test','deckUrl':'https://example.com/p'}, {},'2026-10-27T00:00:00Z',f)
        self.assertEqual(a['status'],'restricted')
    def test_candidate_must_be_reviewed(self):
        x=m.candidate_from('뷰티 광고상품소개서','https://beauty.example.com/ads','Bing RSS','2026-10-27T00:00:00Z')
        self.assertEqual(x['review_status'],'pending')
        self.assertFalse(x['official_verified'])
        self.assertEqual(x['category'],'뷰티')
    def test_change_queue_on_product_and_price(self):
        from source_intelligence import extract_source
        from review_queue import build_review_queue
        url='https://example.com/ad'
        before=b'<html><body><p>Ads media kit banner CPM 1000</p></body></html>'
        after=b'<html><body><p>Ads media kit banner video CPM 2000</p></body></html>'
        old=m.monitor({'id':'xx','name':'Test','deckUrl':url}, {}, '2026-10-27', lambda u:(200,Headers({'Content-Type':'text/html'}),before,False,u))
        new=m.monitor({'id':'xx','name':'Test','deckUrl':url}, old, '2026-10-28', lambda u:(200,Headers({'Content-Type':'text/html'}),after,False,u))
        self.assertEqual(new['status'],'changed_review')
        self.assertTrue(any(c['field']=='rates' for c in new['change_candidates']))
        q=build_review_queue([new],{}, {},'2026-10-28')
        self.assertGreater(q['summary']['pending'],0)
        self.assertEqual(q['items'][0]['status'],'pending')
    def test_unchanged_text_not_queued(self):
        content=b'<html><body>advertising media kit banner CPC 3000</body></html>'
        fetch=lambda u:(200,Headers({'Content-Type':'text/html'}),content,False,u)
        e={'id':'xx','name':'Test','deckUrl':'https://example.com/ads'}
        old=m.monitor(e,{},'2026-10-27',fetch)
        new=m.monitor(e,old,'2026-10-28',fetch)
        self.assertEqual(new['status'],'ok')
        self.assertEqual(new['change_candidates'],[])
    def test_deny_bad_candidate(self):
        self.assertIsNone(m.candidate_from('광고소개서','https://google.com/search?q=a','Bing RSS','now'))

if __name__=='__main__':unittest.main()
