package com.stormgamesstudios.claseweb

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.stormgamesstudios.claseweb.ui.theme.ClaseWEBTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ClaseWEBTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    WebViewScreen(
                        url = "https://acierto-incomodo.github.io/clase-web/",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(url: String, modifier: Modifier = Modifier) {
    var webView: WebView? by remember { mutableStateOf(null) }
    var canGoBack by remember { mutableStateOf(false) }

    BackHandler(enabled = canGoBack) {
        webView?.goBack()
    }

    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                webView = this
                
                // Habilitar aceleración de hardware a nivel de vista
                setLayerType(View.LAYER_TYPE_HARDWARE, null)

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowContentAccess = true
                    allowFileAccess = true
                    mediaPlaybackRequiresUserGesture = false
                    setSupportMultipleWindows(false)
                    javaScriptCanOpenWindowsAutomatically = true
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    
                    // Forzar User Agent de Chrome Móvil para que el servidor envíe el reproductor correcto
                    userAgentString = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
                    
                    // Configuraciones adicionales para imitar un navegador completo
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    cacheMode = WebSettings.LOAD_DEFAULT
                    setSupportZoom(true)
                    builtInZoomControls = true
                    displayZoomControls = false
                }
                
                webChromeClient = object : WebChromeClient() {
                    // Soporte para video a pantalla completa
                    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                        super.onShowCustomView(view, callback)
                    }

                    override fun onHideCustomView() {
                        super.onHideCustomView()
                    }
                }
                
                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        canGoBack = view?.canGoBack() ?: false
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        canGoBack = view?.canGoBack() ?: false
                    }

                    override fun onReceivedError(
                        view: WebView?,
                        request: WebResourceRequest?,
                        error: WebResourceError?
                    ) {
                        // Si falla la carga de la página principal, mostramos el error local
                        if (request?.isForMainFrame == true) {
                            view?.loadUrl("file:///android_asset/error.html")
                        }
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        val url = request?.url?.toString() ?: return false
                        
                        // Integrar visor de PDF dentro de la app usando Google Docs Viewer
                        if (url.endsWith(".pdf", ignoreCase = true) && !url.contains("docs.google.com")) {
                            val googleDocsUrl = "https://docs.google.com/gview?embedded=true&url=$url"
                            view?.loadUrl(googleDocsUrl)
                            return true
                        }

                        // Si es un archivo de video o audio directo, forzamos que se cargue
                        // para que el motor de la WebView use su reproductor interno.
                        if (url.endsWith(".mp4", ignoreCase = true) || 
                            url.endsWith(".m4a", ignoreCase = true) ||
                            url.endsWith(".mp3", ignoreCase = true)) {
                            return false // Dejamos que el WebView lo maneje nativamente
                        }
                        
                        return false
                    }
                }
                loadUrl(url)
            }
        },
        update = { webView ->
            // Si necesitas actualizar el WebView cuando cambie el estado de Compose
        }
    )
}
