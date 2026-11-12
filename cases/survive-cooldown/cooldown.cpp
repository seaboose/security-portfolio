// Isolate the cooldown gate. The caller holds other gameplay conditions fixed.
#if ENCODE_STATE
// Volatile keeps the intermediate byte observable in this teaching fixture.
extern "C" __declspec(noinline) bool ready(double now, double deadline) {
    volatile unsigned char state = now < deadline ? 0x5A : 0xC3;
    return state == 0xC3;
}
#else
extern "C" __declspec(noinline) bool ready(double now, double deadline) {
    return !(now < deadline);
}
#endif

int main() {
    const double deadlines[] = {1.0, 8.0, 64.0};
    for (double deadline : deadlines) {
        if (ready(deadline - 0.25, deadline)) return 1;
        if (!ready(deadline, deadline)) return 2;
        if (!ready(deadline + 0.25, deadline)) return 3;
    }
    return 0;
}
