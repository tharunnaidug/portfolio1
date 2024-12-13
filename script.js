console.log("hello world")
let cursor = document.getElementsByClassName("cursor")
const main = document.getElementById("main")
const toggle = document.getElementById(`toggle`);
const label = document.getElementById(`toggleIcon`);
const btn = document.getElementById(`about-btn`)
const canbtn = document.getElementById(`about-btn1`)
const about = document.getElementsByClassName(`about`)


// main.addEventListener("mousemove",(e)=>{

// })
// main.onmousemove = (e) => {
//     cursor[0].style.left = e.clientX + "px";
//     cursor[0].style.top = e.clientY + "px";
// }

// toggle.addEventListener(`change`, (e) => {
//     label.classList.toggle('dark')
//     document.body.classList.toggle(`dark`, e.target.checked);
// })

// btn.addEventListener("click", () => {
//     about[0].style.display = "block"
// })

// canbtn.addEventListener("click", () => {
//     about[0].style.display = "none"
// })

// // Swiper js
// document.addEventListener('DOMContentLoaded', () => {
//     // Initialize Swiper
//     var swiper = new Swiper(".mySwiper", {
//         slidesPerView: 1,
//         speed: 200,
//         autoplay: {
//             delay: 5000,
//           },
//         spaceBetween: 5,
//         loop: true,
//         pagination: {
//             el: ".swiper-pagination",
//             clickable: true,
//         },
//     });
// });

//web3forms
const form = document.getElementById('form');
const result = document.getElementById('result');

form.addEventListener('submit', function(e) {
    console.log("GG")
  e.preventDefault();
  const formData = new FormData(form);
  const object = Object.fromEntries(formData);
  const json = JSON.stringify(object);
  result.innerHTML = "Please wait..."

    fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: json
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status == 200) {
                result.innerHTML = "Sent ! Will Be Back soon";
            } else {
                console.log(response);
                result.innerHTML = json.message;
            }
        })
        .catch(error => {
            console.log(error);
            result.innerHTML = "Something went wrong!";
        })
        .then(function() {
            form.reset();
            setTimeout(() => {
                result.style.display = "none";
            }, 3000);
        });
});

// Gsap
gsap.registerPlugin(ScrollTrigger)
const t = gsap.timeline();


// t.from(`nav`, {
//     y: -50,
//     delay: 0,
//     opacity: 0,
//     duration: 1,
//     stagger: 0.2
//   })
t.from("#main .mid #d1", {
    duration: 2,
    opacity: 0,
    scale: 1,
    ease: "slow",
    stagger: 0
  })
t.from("#main .mid .d2 ", {
    duration: .5,
    opacity: 0,
    y:50,
    ease: "slow",
    stagger: 0.3
  })

  t.from(`.links`, {
    y: 50,
    delay: 0.1,
    opacity: 0,
    duration: 1.5,
    stagger: 0.2
  })

  gsap.from("#about", {
    opacity: 0,
    duration: 2,
    stagger: 0.2,
    // scrub: 1,
    scrollTrigger: {
      trigger: ".links",
      scroller: "body",
      // markers: true,
      start: "top 25%"
    },
  })
