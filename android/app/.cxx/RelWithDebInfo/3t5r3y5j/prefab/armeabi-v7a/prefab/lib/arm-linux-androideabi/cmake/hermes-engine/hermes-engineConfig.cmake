if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/mmpps/.gradle/caches/9.4.1/transforms/bbeed74aad62cac1697c785dd7853a6c/transformed/hermes-android-260318099.0.4-release/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/mmpps/.gradle/caches/9.4.1/transforms/bbeed74aad62cac1697c785dd7853a6c/transformed/hermes-android-260318099.0.4-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

