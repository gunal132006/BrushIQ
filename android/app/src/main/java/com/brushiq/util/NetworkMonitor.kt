package com.brushiq.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NetworkMonitor @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val _isOnline = MutableStateFlow(checkInitialConnectivity())
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            updateNetworkState(network)
        }

        override fun onLost(network: Network) {
            logNetworkDiagnostics("onLost", null)
            _isOnline.value = checkCurrentActiveNetwork()
        }

        override fun onCapabilitiesChanged(
            network: Network,
            networkCapabilities: NetworkCapabilities
        ) {
            updateNetworkCapabilities(networkCapabilities)
        }
    }

    init {
        try {
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
                .addTransportType(NetworkCapabilities.TRANSPORT_ETHERNET)
                .build()
            connectivityManager.registerNetworkCallback(request, networkCallback)
            logNetworkDiagnostics("init", null)
        } catch (e: Exception) {
            android.util.Log.e("NETWORK", "[NETWORK] Failed to register network callback", e)
        }
    }

    private fun checkInitialConnectivity(): Boolean {
        return checkCurrentActiveNetwork()
    }

    private fun checkCurrentActiveNetwork(): Boolean {
        return try {
            val activeNetwork = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
            evalCapabilities(capabilities)
        } catch (e: Exception) {
            false
        }
    }

    private fun updateNetworkState(network: Network) {
        try {
            val capabilities = connectivityManager.getNetworkCapabilities(network)
            if (capabilities != null) {
                updateNetworkCapabilities(capabilities)
            } else {
                _isOnline.value = true
            }
        } catch (e: Exception) {
            _isOnline.value = true
        }
    }

    private fun updateNetworkCapabilities(capabilities: NetworkCapabilities) {
        val online = evalCapabilities(capabilities)
        logNetworkDiagnostics("onCapabilitiesChanged", capabilities)
        _isOnline.value = online
    }

    private fun evalCapabilities(capabilities: NetworkCapabilities): Boolean {
        val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        val hasTransport = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        return hasInternet && hasTransport
    }

    private fun logNetworkDiagnostics(event: String, capabilities: NetworkCapabilities?) {
        try {
            val activeNetwork = connectivityManager.activeNetwork
            val caps = capabilities ?: (activeNetwork?.let { connectivityManager.getNetworkCapabilities(it) })
            
            val hasActiveNetwork = activeNetwork != null
            val hasInternetCapability = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
            val isValidated = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true
            val transport = when {
                caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "WIFI"
                caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "CELLULAR"
                caps?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "ETHERNET"
                else -> "OTHER"
            }

            android.util.Log.d("NETWORK", "[NETWORK] Event = $event")
            android.util.Log.d("NETWORK", "[NETWORK] hasActiveNetwork = $hasActiveNetwork")
            android.util.Log.d("NETWORK", "[NETWORK] hasInternetCapability = $hasInternetCapability")
            android.util.Log.d("NETWORK", "[NETWORK] isValidated = $isValidated")
            android.util.Log.d("NETWORK", "[NETWORK] transport = $transport")
            android.util.Log.d("NETWORK", "[NETWORK] Evaluated isOnline = ${_isOnline.value}")
        } catch (e: Exception) {
            android.util.Log.e("NETWORK", "[NETWORK] Error logging diagnostics", e)
        }
    }
}
