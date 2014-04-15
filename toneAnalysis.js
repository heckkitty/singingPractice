/**
 * Tone analysis library by David Hinkle.
 */
 
var ToneAnalysis = function (audioContext, inputNode) {
    // The largest legal size for the analyserNode fft is 2048
    this.fftSize = 2048;
    // How many frequency bins will be present
    this.numBins = this.fftSize/2;
    // Sample rate of the FFT
    this.sampleRate = undefined;    
    // The top frequency of the FFT 
    this.topFrequencyHz = undefined;
    // How wide each bin is in HZ (sampleRate/fftSize)
    this.binWidthHz = undefined;
    // The mose recent frequency Domain data
    this.freqDomainData = undefined;
    // Loudest tone in Hz
    this.freqToneHz = undefined;
    
    // Hold onto some references
    this._audioContext = audioContext;
    this._analyserNode = undefined;

    this.initialize(inputNode);  
};

ToneAnalysis.prototype = {
    initialize: function (inputNode) {
        this._analyserNode = this._audioContext.createAnalyser();
        this._analyserNode.fftSize = this.fftSize;
        
        // Some interesting member variables I may want to play with later
        //analyserNode.smoothingTimeConstant = 0.6;
        //analyserNode.minDecibels = -140;
        //analyserNode.maxDecibels = 0;

        inputNode.connect( this._analyserNode );

        this.sampleRate = this._audioContext.sampleRate;
        this.binWidthHz = this.sampleRate/this.fftSize;
        this.topFrequencyHz = this.sampleRate/2;
    },

    /**
     * Run this to update everything
     */
    update: function() {
        this.freqDomainData = new Uint8Array(this._analyserNode.frequencyBinCount);   
        this._analyserNode.getByteFrequencyData(this.freqDomainData);
        this.estimateTone();
    },
    
    /**
     * Returns the center frequency of a bin index, works with fractional indexes
     */
    frequencyOfBinIndex: function (index) {
        return(this.binWidthHz*index);
    },

    /**
     * Estimates the primary tone of a set of frequency domain data by looking for 
     * the max, then using a quadratic curve fit of it and the two nearest points.
     * http://www.dspguru.com/dsp/howtos/how-to-interpolate-fft-peak
     */
    estimateTone: function () {
        var maxIndex = 0;
        var maxLoudness = 0;
        /* Skips the DC bin because we don't want that to be our max, and
           so that our code below doesn't break when we try to read the contents
           one bin down */
        for (var i = 1; i < this.freqDomainData.length; i++)
            if (this.freqDomainData[i] > maxLoudness) {
                maxLoudness = this.freqDomainData[i];
                maxIndex = i;
            }
        
        var y1 = this.freqDomainData[maxIndex-1];
        var y2 = this.freqDomainData[maxIndex];
        var y3 = this.freqDomainData[maxIndex+1];
        var d = (y3 - y1) / (2 * (2 * y2 - y1 - y3));
        var Index = maxIndex + d;
        
        this.freqToneHz = this.frequencyOfBinIndex(Index);
        return(this.freqToneHz);
    }    
    
    
    
}