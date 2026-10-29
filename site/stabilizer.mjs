// Spatial, symmetric local regression: no temporal lag or invented samples.
// Resampling and corner splitting remain in pen-path; raw gesture points are untouched.
export function stabilizeSegment(points,strength=0,scale=1){
 if(!strength||points.length<5)return points;
 const radius=(2+10*strength)/scale,limit=(.3+3.7*strength)/scale,d=[0];
 for(let i=1;i<points.length;i++)d.push(d.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 let lo=0,hi=0;
 return points.map((p,i)=>{if(!i||i===points.length-1)return p;while(d[lo]<d[i]-radius)lo++;while(hi+1<points.length&&d[hi+1]<=d[i]+radius)hi++;let w=0,t=0,tt=0,x=0,y=0,xt=0,yt=0;for(let j=lo;j<=hi;j++){const z=d[j]-d[i],q=(1-(z/radius)**2)**2;w+=q;t+=q*z;tt+=q*z*z;x+=q*points[j][0];y+=q*points[j][1];xt+=q*z*points[j][0];yt+=q*z*points[j][1];}const det=w*tt-t*t;if(det<1e-9)return p;let dx=(x*tt-t*xt)/det-p[0],dy=(y*tt-t*yt)/det-p[1];const length=Math.hypot(dx,dy),edge=Math.min(1,d[i]/radius,(d.at(-1)-d[i])/radius),factor=Math.min(1,limit/(length||1))*edge;return[p[0]+dx*factor,p[1]+dy*factor,p[2]];});
}
