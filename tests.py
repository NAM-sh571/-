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
        self.assertEqual(a['status'],'changed_review')
        self.assertIn('검토',a['message'])
    def test_403_not_broken_document_claim(self):
        def f(url): raise HTTPError(url,403,'forbidden',{},None)
        a=m.monitor({'id':'test','name':'test','deckUrl':'https://example.com/p'}, {},'2026-10-27T00:00:00Z',f)
        self.assertEqual(a['status'],'restricted')
    def test_candidate_must_be_reviewed(self):
        x=m.candidate_from('뷰티 광고상품소개서','https://beauty.example.com/ads','Bing RSS','2026-10-27T00:00:00Z')
        self.assertEqual(x['review_status'],'pending')
        self.assertFalse(x['official_verified'])
        self.assertEqual(x['category'],'뷰티')
    def test_deny_bad_candidate(self):
        self.assertIsNone(m.candidate_from('광고소개서','https://google.com/search?q=a','Bing RSS','now'))

if __name__=='__main__':unittest.main()
