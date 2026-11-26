"""Study-only sharp-route morphing and square-glyph attachment; no solver changes."""
import numpy as np

def simplify(points,eps=1e-6):
 out=[]
 for q in np.asarray(points,float):
  if out and np.linalg.norm(q-out[-1])<=eps:continue
  out.append(q.copy())
  while len(out)>=3:
   u,v=out[-2]-out[-3],out[-1]-out[-2]
   if abs(np.cross(u,v))<=eps*max(1.,np.linalg.norm(u)*np.linalg.norm(v)) and np.dot(u,v)>=0:out.pop(-2)
   else:break
 return np.asarray(out)

def vertex_pair(first,last):
 a,b=simplify(first),simplify(last)
 # Match bends before rounding; interpolation of curve samples makes false waves.
 fa=np.linspace(0,1,len(a));fb=np.linspace(0,1,len(b));f=np.unique(np.r_[fa,fb])
 sample=lambda p,t:np.column_stack([np.interp(f,t,p[:,k]) for k in [0,1]])
 return sample(a,fa),sample(b,fb)

def clip_start(points,center,half):
 for j in range(1,len(points)):
  q=points[j]
  if np.max(np.abs(q-center))<=half+1e-7:continue
  p=points[j-1];v=q-p;t=1.
  for axis in [0,1]:
   if v[axis]>1e-9:t=min(t,(center[axis]+half-p[axis])/v[axis])
   elif v[axis]<-1e-9:t=min(t,(center[axis]-half-p[axis])/v[axis])
  return np.vstack([p+np.clip(t,0,1)*v,points[j:]])
 return np.empty((0,2))

def attach(points,first,last,side):
 if np.max(np.abs(first-last))<side-1e-6:return np.empty((0,2))
 p=np.vstack([first,np.asarray(points)[1:-1],last]);p=clip_start(p,first,side/2)
 if len(p)<2:return p
 p=clip_start(p[::-1],last,side/2)[::-1]
 return simplify(p) if len(p)>=2 else p
