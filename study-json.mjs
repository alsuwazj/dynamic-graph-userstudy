export async function readStudyJson(path, {fetcher=fetch, attempts=3, wait=ms=>new Promise(r=>setTimeout(r,ms))}={}) {
  const url=new URL(path,import.meta.url),name=url.pathname.split('/').pop();
  let detail='The study files could not be reached.';
  for(let attempt=0;attempt<attempts;attempt++){
    try{
      const response=await fetcher(url.href,{cache:'no-store',signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw Error(`The server returned HTTP ${response.status}.`);
      const body=await response.text();
      if(body.trimStart().startsWith('<'))throw Error('The server returned a web page instead of study data.');
      try{return JSON.parse(body.trimStart());}catch{throw Error('The server returned incomplete study data.');}
    }catch(error){detail=error.name==='TimeoutError'?'The download timed out.':error.message;}
    if(attempt+1<attempts)await wait(250*(attempt+1));
  }
  throw Error(`Could not load ${name}. ${detail} Please try again.`);
}
