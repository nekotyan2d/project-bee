<template>
    <div>
        <NuxtPwaAssets />
        <NuxtRouteAnnouncer />
        <ToastHost />
        <NuxtLayout>
            <NuxtPage :keepalive="{ include: ['index', 'analytics', 'colonies-id'] }" />
        </NuxtLayout>
    </div>
</template>
