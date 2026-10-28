"""Persistent human-review queue; extraction hints never overwrite the seed catalog."""
from __future__ import annotations
from source_intelligence import candidate_id

def build_review_queue(states, previous, decisions, now):
    old={x.get('id'):x for x in previous.get('items',[]) if x.get('id')}
    decided={x.get('id'):x for x in decisions.get('decisions',[]) if x.get('id')}
    seen=set()
    entries=[]
    for state in states:
        for delta in state.get('change_candidates',[]):
            identifier=candidate_id(state['id'],delta['field'],delta.get('added',[]),delta.get('no_longer_detected',[]))
            if identifier in seen:
                continue
            seen.add(identifier)
            prior=old.get(identifier,{})
            decision=decided.get(identifier,{})
            item={'id':identifier,'media_id':state['id'],'media_name':state.get('name',''),
                  'field':delta['field'],'added':delta.get('added',[]),
                  'no_longer_detected':delta.get('no_longer_detected',[]),
                  'source_url':state.get('source_url',''),
                  'verification':delta.get('verification','unverified_extraction'),
                  'status':decision.get('status') or prior.get('status','pending'),
                  'first_seen':prior.get('first_seen',now),'last_seen':now}
            entries.append(item)
    # Keep pending issues while new scans observe no change, until reviewed.
    for identifier,item in old.items():
        if identifier not in seen and item.get('status')=='pending':
            entries.append({**item,'status':'pending','not_observed_again':True})
    entries.sort(key=lambda x:(x.get('status')!='pending',x.get('media_name',''),x['id']))
    entries=entries[:1000]
    summary={'total':len(entries),'pending':sum(x['status']=='pending' for x in entries),
             'reviewed':sum(x['status']!='pending' for x in entries)}
    return {'schema_version':1,'generated_at':now,'disclaimer':'자동 추출값은 미검증 후보로, 기존 매체 DB를 수정하지 않습니다.',
            'summary':summary,'items':entries}
