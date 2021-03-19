// Area:
function Area(Increment, Count, Width, Height, Margin = 10) {
    let i = w = 0;
    let h = Increment * 0.55 + (Margin * 2);
    while (i < (Count)) {
        if ((w + Increment) > Width) {
            w = 0;
            h = h + (Increment * 0.55) + (Margin * 2);
        }
        w = w + Increment + (Margin * 2);
        i++;
    }
    if (h > Height) return false;
    else return Increment;
}
// Dish:
function Dish() {

    // variables:
        let Margin = 2;
        let Scenary = document.getElementById('Dish');
        let Width = Scenary.offsetWidth - (Margin * 2);
        let Height = Scenary.offsetHeight - (Margin * 2);
        let Cameras = document.getElementsByTagName('Video');
        let max = 0;
    
    // loop (i recommend you optimize this)
        let i = 1;
        while (i < 5000) {
            let w = Area(i, Cameras.length, Width, Height, Margin);
            if (w === false) {
                max =  i - 1;
                break;
            }
            i++;
        }
    
    // set styles
        max = max - (Margin * 2);
        setWidth(max, Margin);
}

// Set Width and Margin 
function setWidth(width, margin) {
    let Cameras = document.getElementsByTagName('Video');
    for (var s = 0; s < Cameras.length; s++) {
        Cameras[s].style.width = width + "px";
        Cameras[s].style.border = "thick solid #8C9FFE";
        Cameras[s].style.margin = margin + "px";
        Cameras[s].style.height = (width * 0.55) + "px";
    }
}

// Load and Resize Event
window.addEventListener("load", function (event) {
    Dish();
    window.onresize = Dish;
}, false);