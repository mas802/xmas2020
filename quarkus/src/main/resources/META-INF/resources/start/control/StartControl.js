export const trainToggle = async (label) => {
    let response, result;

    console.log(Date.now() + ' train toggle call start');
    try {
        response = await fetch('http://train.802.ch/train/?key=' + label, {
            method: 'GET'
        });
        result = await response.json();
    } catch (error) {
        console.log(error, 'Train server is not available');
        return {"state":"error", "until":"-1"};
        return;
    } finally {
      console.log(Date.now() + ' train toggle call end');
    }

    console.log(result);
    return result;
}

export const trainInfo = async (label) => {
    let response, result;

    console.log(Date.now() + ' train info call start');
    try {
        response = await fetch('http://train.802.ch/train/info?key=' + label, {
            method: 'GET'
        });
        result = await response.json();
    } catch (error) {
        console.log(error, 'Train server is not available');
        return {"state":"error", "until":"-1"};
        return;
    } finally {
      console.log(Date.now() + ' train info call end');
    }

    console.log(result);
    return result;
}
