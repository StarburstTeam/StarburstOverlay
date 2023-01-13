let testTime = 10 * 1000, testing = false, tested = false;
let leftCnt = 0, rightCnt = 0;

const setTestTime = (time) => {
    testTime = time * 1000;
    document.getElementById('cpsTestTime').innerText = `Test Time : ${time}s`;
}

const onTestClick = (button) => {
    if (tested) return;
    if (!testing) {
        leftCnt = rightCnt = 0;
        testing = true;
        let testLast = testTime;
        let t = setInterval(() => {
            if (testLast == 0 || tested) {
                clearInterval(t);
                testing = false;
                tested = true;
                document.getElementById('testCpsButton').innerHTML = `Time Last : ${testLast / 1000}s<br>Left Click : ${leftCnt} , Right Click : ${rightCnt}`;
                let result = document.getElementById('cpsTestResult');
                if (rightCnt == 0)
                    return result.innerHTML = `Your left button clicking speed is <b>${leftCnt * 1000 / testTime}</b>CPS`;
                if (leftCnt == 0)
                    return result.innerHTML = `Your right button clicking speed is <b>${rightCnt * 1000 / testTime}</b>CPS`;
                return result.innerHTML = `Your left button clicking speed is <b>${leftCnt * 1000 / testTime}</b>CPS , Your right button clicking speed is <b>${rightCnt * 1000 / testTime}</b>CPS`;
            }
            testLast -= 100;
            document.getElementById('testCpsButton').innerHTML = `Time Last : ${testLast / 1000}s<br>Left Click : ${leftCnt} , Right Click : ${rightCnt}`;
        }, 100);
    }
    if (button == 0) leftCnt++;
    if (button == 2) rightCnt++;
}

const resetTest = () => {
    tested = false;
    document.getElementById('cpsTestResult').innerHTML = '';
    document.getElementById('testCpsButton').innerHTML = 'Click to Start';
}