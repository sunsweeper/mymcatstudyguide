document.getElementById('contactForm').addEventListener('submit',async event=>{
 event.preventDefault(); const form=event.currentTarget,status=document.getElementById('contactStatus'),button=form.querySelector('button[type="submit"]');
 button.disabled=true; status.textContent='Sending…';
 try {const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
 if(!response.ok)throw new Error(response.status===503?'Message delivery is not configured yet. Please try again later.':'Your message could not be sent. Please try again.');
 status.textContent='Your message has been sent.';form.reset();
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
