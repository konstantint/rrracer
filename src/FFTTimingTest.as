package  
{
	import flash.display.Sprite;
	import flash.text.*;
	
	/**
	* Simple program for testing the performance of an FFT implementation.
	*
	* Typical output be something like this:
	*    1000 fwd-inv pairs of 1024 pt FFTs took 659 ms, or 0.330 ms per FFT.
	* @author Gerry Beauregard
	* @haxe Rigondo
	*/
	[SWF(width='600', height='400', frameRate='30', backgroundColor='0xFFFFFF')]
	public class FFTTimingTest extends Sprite {
		public const LOG_N = 10;           // Log2 of the FFT length
		public const N = 1 << LOG_N;     // FFT Length (2^LOG_N)
		public const NUM_LOOPS = 1000;   // Float of forward-inverse FFT iterations for timing test
	 
		public function FFTTimingTest() {
			initTest();
	 
			print('Performing FFTs...');
	 
			// Create vectors for the real & imaginary
			// components of the input/output data.
			var xRe = new Vector.<Number>(N);
			var xIm = new Vector.<Number>(N);
	 
			// Initialize with some data.
			for (var i = 0; i < N; i++)
			{
				xRe[i] = Math.cos(2*Math.PI*2*i/N);
				xIm[i] = 0.0;
			}
	 
			// Create and initial the FFT class
			var fft = new FFT2();
			fft.init(LOG_N);
	 
			// Do repeated forward & inverse FFTs
			var startTime = getTimer();
			for (i = 0; i < NUM_LOOPS; i++)
			{
				fft.run( xRe, xIm, FFT2.FORWARD );
				fft.run( xRe, xIm, FFT2.INVERSE );
			}
			var endTime = getTimer();
	 
			// Compute and display the elapsed time
			var elapsed = endTime - startTime;
			var timePerFFT = elapsed / (2.0*NUM_LOOPS);
			print(NUM_LOOPS + " fwd-inv pairs of " + N + " pt FFTs took " + elapsed + " ms, or " +
				(int(timePerFFT * 1000) / 1000) + " ms per FFT.");
	 
		}
		function getTimer() { return new Date().time; }
	 	 
			var textField:flash.text.TextField;
			function initTest() {
				var c = this;
					c.stage.align = flash.display.StageAlign.TOP_LEFT;
					c.stage.scaleMode = flash.display.StageScaleMode.NO_SCALE;
					textField = new flash.text.TextField();
					textField.autoSize = flash.text.TextFieldAutoSize.LEFT;
					textField.selectable = false;
					textField.multiline = true;
					//textField.defaultTextFormat = new flash.text.TextFormat( 'Verdana', 12, 0xFFFFFF );
					addChild( textField );
					textField.text =    '';
			}
	 
		function print(s) {
				textField.text +=   s + '\n';
		}
	 
	}


}