const funcs={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,ln:Math.log,log:Math.log10};
export function compileGraph(source,parameter){
 const text=source.trim().replace(/^y\s*=/i,'').replaceAll('π','pi').replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/').toLowerCase();if(!text||text.length>240)throw Error('Nhập công thức dài tối đa 240 ký tự.');
 const raw=[];let pos=0;while(pos<text.length){if(/\s/.test(text[pos])){pos++;continue;}const m=text.slice(pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|^[a-z]+|^[()+\-*/^]/);if(!m)throw Error('Ký hiệu không hỗ trợ: '+text[pos]);raw.push(m[0]);pos+=m[0].length;}if(raw.length>160)throw Error('Công thức quá phức tạp.');
 const end=t=>t===')'||t==='x'||t==='a'||t==='pi'||t==='e'||/^\d|^\./.test(t),start=t=>t==='('||t==='x'||t==='a'||t==='pi'||t==='e'||Object.hasOwn(funcs,t);
 const ts=[];for(const t of raw){if(ts.length&&end(ts.at(-1))&&start(t))ts.push('*');ts.push(t);}let i=0,depth=0;
 function atom(){if(++depth>40)throw Error('Quá nhiều dấu ngoặc/lũy thừa.');const t=ts[i++];let f;if(t==='('){f=sum();if(ts[i++]!==')')throw Error('Thiếu dấu đóng ngoặc.');}else if(t==='x')f=x=>x;else if(t==='a'&&Number.isFinite(parameter))f=()=>parameter;else if(t==='pi')f=()=>Math.PI;else if(t==='e')f=()=>Math.E;else if(Object.hasOwn(funcs,t)){if(ts[i++]!=='(')throw Error(t+' cần dấu ngoặc, ví dụ '+t+'(x).');const a=sum();if(ts[i++]!==')')throw Error('Thiếu dấu đóng ngoặc.');f=x=>funcs[t](a(x));}else if(t!==undefined&&Number.isFinite(Number(t)))f=()=>Number(t);else throw Error('Dùng x, pi, e hoặc các hàm được hỗ trợ.');depth--;return f;}
 function power(){const a=atom();if(ts[i]==='^'){i++;const b=unary();return x=>a(x)**b(x);}return a;}
 function unary(){if(ts[i]==='+'||ts[i]==='-'){const sign=ts[i++];if(++depth>40)throw Error('Công thức quá sâu.');const a=unary();depth--;return x=>sign==='-'?-a(x):a(x);}return power();}
 function product(){let a=unary();while(ts[i]==='*'||ts[i]==='/'){const op=ts[i++],left=a,b=unary();a=x=>op==='*'?left(x)*b(x):left(x)/b(x);}return a;}
 function sum(){let a=product();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++],left=a,b=product();a=x=>op==='+'?left(x)+b(x):left(x)-b(x);}return a;}
 const f=sum();if(i!==ts.length)throw Error('Kiểm tra phép toán và dấu ngoặc.');return f;
}
export function graphRoots(f,min,max){
 const out=[],n=1200,step=(max-min)/n,tol=1e-7;const add=x=>{if(Number.isFinite(x)&&Math.abs(f(x))<1e-5&&!out.some(v=>Math.abs(v-x)<Math.max(1e-5,step*.2)))out.push(x);};
 let a=min,fa=f(a);for(let j=1;j<=n;j++){const b=min+j*step,fb=f(b);if(Math.abs(fa)<tol)add(a);if(Number.isFinite(fa)&&Number.isFinite(fb)&&fa*fb<0){let lo=a,hi=b,flo=fa;for(let k=0;k<50;k++){const m=(lo+hi)/2,fm=f(m);if(!Number.isFinite(fm))break;if(flo*fm<=0)hi=m;else{lo=m;flo=fm;}}add((lo+hi)/2);}if(j<n){const c=b+step,fc=f(c);if(Number.isFinite(fb)&&Math.abs(fb)<Math.abs(fa)&&Math.abs(fb)<Math.abs(fc)){let lo=a,hi=c;for(let k=0;k<45;k++){const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3;if(Math.abs(f(l))<Math.abs(f(r)))hi=r;else lo=l;}add((lo+hi)/2);}}a=b;fa=fb;if(out.length>=80)break;}add(max);return out.sort((a,b)=>a-b);
}
