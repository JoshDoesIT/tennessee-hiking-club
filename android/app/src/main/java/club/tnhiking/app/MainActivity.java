package club.tnhiking.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the local plugin before the bridge starts (#294).
        registerPlugin(DecorBackgroundPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
