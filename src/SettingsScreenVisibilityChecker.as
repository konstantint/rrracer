package {
	import flash.display.Stage;
	import flash.display.BitmapData;
	
	/**
	 * Utility class that uses a hack-workaround to check whether the security dialog is currently visible.
	 * 	http://stackoverflow.com/questions/6945055/flash-security-settings-panel-listening-for-close-event
	 *  http://rabidgadfly.com/2008/10/refer-to-stage-from-as3-class/
	 */
	public class SettingsScreenVisibilityChecker {
		private var m_stage: Stage;
		
		public function SettingsScreenVisibilityChecker(stage:Stage) {
			m_stage = stage;
		}
		
		public function settingsScreenVisible(): Boolean {
			var dummy:BitmapData = new BitmapData(1, 1);
			try {
				// Try to capture the stage: triggers a Security error when the settings dialog box is open
				dummy.draw(m_stage);
			}
			catch (error:Error) {
				return true;
			}
			finally {
				dummy.dispose();
			}
			return false;
		 }
	}
}