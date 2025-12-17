import torch

LR = 1e-2


class Linear:
    def __init__(self, in_features, out_features, bias=True):
        W = torch.randn(in_features, out_features) * (5 / 3) / (in_features**0.5)
        B = torch.zeros(out_features)

        self.W = W

        if bias:
            self.B = B
            self.parameters = [W, B]
        else:
            self.parameters = [W]

        for p in self.parameters:
            p.requires_grad = True

    def __call__(self, x):

        for p in self.parameters:
            p.grad = None

        self.out = (x @ self.W) + self.B

        return self.out

    def step(self):
        for p in self.parameters:
            p.data -= p.grad * LR


class BatchNorm:
    def __init__(
        self, num_features=None, eps=1e-05, momentum=0.1, track_running_stats=True
    ):
        # TODO: check what is num_features for

        self.BN_y = torch.ones(1)
        self.BN_b = torch.zeros(1)

        self.BN_mean = None
        self.BN_var = None

        self.momentum = momentum
        self.track_running_stats = track_running_stats
        self.eps = eps

        self.parameters = [self.BN_b, self.BN_y]

        for p in self.parameters:
            p.requires_grad = True

    def __call__(self, x: torch.Tensor):
        for p in self.parameters:
            p.grad = None

        mean = x.mean(0, keepdim=True)
        var = x.var(0, keepdim=True)

        if self.track_running_stats:
            if self.BN_mean is None:
                self.BN_mean = mean
            if self.BN_var is None:
                self.BN_var = var

            self.BN_mean = ((1 - self.momentum) * self.BN_mean) + (self.momentum * mean)
            self.BN_var = ((1 - self.momentum) * self.BN_var) + (self.momentum * mean)

        self.out = self.BN_y * ((x - mean) / (var + self.eps) ** 0.5) + self.BN_b

        return self.out

    def step(self):
        for p in self.parameters:
            p.data -= p.grad * LR


class Tanh:
    def __init__(self):
        pass

    def __call__(self, x):
        self.out = torch.tanh(x)

        return self.out

    def step(self):
        pass
