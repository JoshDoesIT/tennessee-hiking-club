package club.tnhiking.app;

import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Sets the window decor background colour at runtime so the edge-to-edge area
 * behind the transparent status and navigation bars follows the app's in-app
 * dark/light theme (#294).
 *
 * Capacitor's built-in SystemBars sets this once, from the static theme
 * windowBackground, so it can't track the web `.dark` toggle. This overrides the
 * same view on a theme change; since it runs after SystemBars and nothing resets
 * the decor background afterward, it wins.
 */
@CapacitorPlugin(name = "DecorBackground")
public class DecorBackgroundPlugin extends Plugin {

    @PluginMethod
    public void setColor(PluginCall call) {
        String color = call.getString("color");
        if (color == null) {
            call.reject("color is required");
            return;
        }
        try {
            final int parsed = Color.parseColor(color);
            getActivity()
                .runOnUiThread(() ->
                    getActivity().getWindow().getDecorView().setBackgroundColor(parsed)
                );
            call.resolve();
        } catch (IllegalArgumentException e) {
            call.reject("invalid color: " + color);
        }
    }
}
