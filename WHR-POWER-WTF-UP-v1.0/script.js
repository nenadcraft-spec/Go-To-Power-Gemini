/* JOYSTICK ENGINE WITH DYNAMIC RANGE */
const joystick = {
    zone: document.getElementById("joystickZone"),
    base: document.getElementById("joystickBase"),
    stick: document.getElementById("joystickStick"),
    active: false,
    touchId: null,
    startX: 0,
    maxRadius: 75 // Znatno širi dijapazon za klizanje prsta
};

function initJoystick() {
    if (!joystick.zone || !joystick.base || !joystick.stick) return;

    function handleStart(e) {
        e.preventDefault();
        if (joystick.active) return;

        const touch = e.changedTouches ? e.changedTouches[0] : e;
        joystick.active = true;
        joystick.touchId = touch.identifier ?? "mouse";

        const rect = joystick.base.getBoundingClientRect();
        joystick.startX = rect.left + rect.width / 2;

        handleMove(e);
    }

    function handleMove(e) {
        if (!joystick.active) return;

        let touch = null;
        if (e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystick.touchId) {
                    touch = e.changedTouches[i];
                    break;
                }
            }
        } else {
            touch = e;
        }

        if (!touch) return;

        let deltaX = touch.clientX - joystick.startX;

        if (deltaX > joystick.maxRadius) deltaX = joystick.maxRadius;
        if (deltaX < -joystick.maxRadius) deltaX = -joystick.maxRadius;

        joystick.stick.style.transform = `translateX(${deltaX}px)`;

        const intensity = deltaX / joystick.maxRadius;

        if (intensity < -0.12) {
            state.touch.left = true;
            state.touch.right = false;
        } else if (intensity > 0.12) {
            state.touch.right = true;
            state.touch.left = false;
        } else {
            state.touch.left = false;
            state.touch.right = false;
        }
    }

    function handleEnd(e) {
        if (!joystick.active) return;

        if (e.changedTouches) {
            let touchFound = false;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystick.touchId) {
                    touchFound = true;
                    break;
                }
            }
            if (!touchFound) return;
        }

        joystick.active = false;
        joystick.touchId = null;
        joystick.stick.style.transform = `translateX(0px)`;

        state.touch.left = false;
        state.touch.right = false;
    }

    joystick.zone.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd, { passive: false });
    window.addEventListener("touchcancel", handleEnd, { passive: false });
}
