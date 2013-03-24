/**
 * Helper class for ExternalInterface.
 */
package  
{
	import flash.external.ExternalInterface;
	import flash.text.TextField;
	import flash.system.Security;
	import flash.external.ExternalInterface;

	public class ExternalInterfaceHelper 
	{
		private var m_debugOut:TextField;
		private var m_haveExternalInterface: Boolean;
		public function ExternalInterfaceHelper(debugOut: TextField = null) {
			m_debugOut = debugOut;
			m_haveExternalInterface = false;
            if (ExternalInterface.available) {
                try {
					debug("Initializing external interface...");
					Security.allowDomain("*");
					m_haveExternalInterface = true;
                } catch (error:SecurityError) {
                    debug("A SecurityError occurred: " + error.message + "\n");
                } catch (error:Error) {
                    debug("An Error occurred: " + error.message + "\n");
                }
            } else {
                debug("External interface is not available for this container.");
            }						
		}
		public function debug(msg: String):void {
			if (m_debugOut != null) m_debugOut.appendText(msg + "\n");
		}
		
		public function addCallback(name:String, method:Function):void {
			if (m_haveExternalInterface) {
				try {
					debug("Adding callback...");
					ExternalInterface.addCallback(name, method);
				} catch (error:SecurityError) {
					debug("A SecurityError occurred: " + error.message + "\n");
				} catch (error:Error) {
					debug("An Error occurred: " + error.message + "\n");
				}
			}
		}
	}

}