function waittime(ms = 495) {
  return new Promise(resolve => {setTimeout(resolve, ms)});
}

async function openClose(nav, btnNav) {
  if(nav.classList.contains('opened')) {
    nav.classList.add('out');
    await waittime();
    btnNav.innerHTML = '<i class="fa-solid fa-bars"></i>';
    nav.classList.remove('opened');
  } else {
    nav.classList.add('out');
    await waittime();
    btnNav.innerHTML = '<i class="fa-solid fa-circle-x"></i>';
    nav.classList.add('opened');
  }
  nav.classList.remove('out');
}

export default function() {
  const isScrollable = document.querySelectorAll("[scroll]");
  isScrollable.forEach(escroll => {
    escroll.onclick = e => {
      e.preventDefault();
      document.getElementById(escroll.getAttribute("href").replace("#", "")).scrollIntoView();
    }
  });
  const nav = document.querySelector('.nav');
  const btnNav = nav.querySelector('.btn-menu');
  btnNav.onclick = () => openClose(nav, btnNav);

  const bars = nav.querySelectorAll('.nav-list a');
  bars.forEach(bar => {
    const link = bar.getAttribute('href');
    const isRedirect = bar.getAttribute('data-r');
    const noOpen = bar.getAttribute("nopen");
    if(noOpen) {
      bar.addEventListener("click", (e) => {
        e.preventDefault();
        openClose(nav, btnNav);
      })
      return;
    }

    bar.onclick = async(e) => {
      e.preventDefault();
      if(isRedirect) {
        openClose(nav, btnNav);
        if(bar.getAttribute('target')) {
          window.open(link);
          return;
        }
        window.location.href = link;
        return;
      } else {
        document.querySelector(link).scrollIntoView();
        openClose(nav, btnNav);
      }
    }
  });
}