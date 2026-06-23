package com.brushiq.di

import com.brushiq.BuildConfig
import com.brushiq.data.remote.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.Interceptor
import okhttp3.Response
import okio.Buffer
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.SocketException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        loggingInterceptor: HttpLoggingInterceptor,
        authInterceptor: AuthInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .addInterceptor(NetworkDebugInterceptor())
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        val baseUrl = if (BuildConfig.DEBUG) {
            BuildConfig.DEV_BASE_URL
        } else {
            BuildConfig.PROD_BASE_URL
        }

        android.util.Log.d("AuthFlow", "Build Type: DEBUG=${BuildConfig.DEBUG}")
        android.util.Log.d("AuthFlow", "Selected Base URL: $baseUrl")

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .client(okHttpClient)
            .build()
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi {
        return retrofit.create(AuthApi::class.java)
    }

    @Provides
    @Singleton
    fun provideFamilyApi(retrofit: Retrofit): FamilyApi {
        return retrofit.create(FamilyApi::class.java)
    }

    @Provides
    @Singleton
    fun provideToothbrushApi(retrofit: Retrofit): ToothbrushApi {
        return retrofit.create(ToothbrushApi::class.java)
    }

    @Provides
    @Singleton
    fun provideScanApi(retrofit: Retrofit): ScanApi {
        return retrofit.create(ScanApi::class.java)
    }

    @Provides
    @Singleton
    fun provideTipsApi(retrofit: Retrofit): TipsApi {
        return retrofit.create(TipsApi::class.java)
    }

    @Provides
    @Singleton
    fun provideProfileApi(retrofit: Retrofit): ProfileApi {
        return retrofit.create(ProfileApi::class.java)
    }
}

class NetworkDebugInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val url = request.url.toString()
        val method = request.method
        val isAuth = url.contains("/auth/") || url.contains("auth")

        // Read request body safely
        var requestBodyString = ""
        try {
            val requestBody = request.body
            if (requestBody != null) {
                val buffer = Buffer()
                requestBody.writeTo(buffer)
                requestBodyString = buffer.readString(Charsets.UTF_8)
            }
        } catch (e: Exception) {
            requestBodyString = "Could not read request body: ${e.message}"
        }

        // Log request details
        val requestLog = StringBuilder().apply {
            append("--> Request URL: $url\n")
            append("HTTP Method: $method\n")
            if (requestBodyString.isNotEmpty()) {
                append("Request Body: $requestBodyString\n")
            }
            append("--> END $method")
        }.toString()

        android.util.Log.d("NetworkDebug", requestLog)
        if (isAuth) {
            android.util.Log.d("AuthDebug", requestLog)
        }

        try {
            val response = chain.proceed(request)
            val code = response.code

            // Read response body safely without consuming the stream
            var responseBodyString = ""
            try {
                val responseBody = response.body
                if (responseBody != null) {
                    val source = responseBody.source()
                    source.request(Long.MAX_VALUE)
                    val buffer = source.buffer
                    responseBodyString = buffer.clone().readString(Charsets.UTF_8)
                }
            } catch (e: Exception) {
                responseBodyString = "Could not read response body: ${e.message}"
            }

            val responseLog = StringBuilder().apply {
                append("<-- Response Code: $code\n")
                append("URL: $url\n")
                append("HTTP Method: $method\n")
                if (responseBodyString.isNotEmpty()) {
                    append("Response Body: $responseBodyString\n")
                }
                append("<-- END HTTP")
            }.toString()

            android.util.Log.d("NetworkDebug", responseLog)
            if (isAuth) {
                android.util.Log.d("AuthDebug", responseLog)
            }

            return response
        } catch (e: SocketTimeoutException) {
            val errorLog = "Timeout exception calling $method $url: ${e.message}"
            android.util.Log.e("NetworkDebug", errorLog, e)
            if (isAuth) {
                android.util.Log.e("AuthDebug", errorLog, e)
            }
            throw e
        } catch (e: SocketException) {
            val errorLog = "Socket exception calling $method $url: ${e.message}"
            android.util.Log.e("NetworkDebug", errorLog, e)
            if (isAuth) {
                android.util.Log.e("AuthDebug", errorLog, e)
            }
            throw e
        } catch (e: IOException) {
            val errorLog = "IO exception calling $method $url: ${e.message}"
            android.util.Log.e("NetworkDebug", errorLog, e)
            if (isAuth) {
                android.util.Log.e("AuthDebug", errorLog, e)
            }
            throw e
        }
    }
}
