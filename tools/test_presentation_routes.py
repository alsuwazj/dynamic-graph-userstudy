import unittest
import numpy as np
from presentation_routes import clean_routes


class StudyPresentationTests(unittest.TestCase):
    def test_chain_detour_is_removed_and_ports_centered(self):
        p=np.array([[0.,0.],[100.,0.]])
        before=p.copy()
        routes,audit=clean_routes(p,[[20.,20.]]*2,[(0,1)],
            [[(10.,4.),(30.,4.),(30.,25.),(80.,25.),(80.,4.),(90.,4.)]])
        np.testing.assert_array_equal(p,before)
        self.assertEqual(routes,[[(10.,0.),(90.,0.)]])
        self.assertEqual(audit['offCenterSingletons'],[])

    def test_obstacle_is_not_cut_by_a_chain_shortcut(self):
        routes,audit=clean_routes([[0,0],[100,0],[50,0]],[[20,20]]*3,[(0,1)],
            [[(10,0),(20,0),(20,-25),(80,-25),(80,0),(90,0)]])
        self.assertGreater(len(routes[0]),2)
        self.assertEqual(audit['nodeIntersections'],0)
        self.assertEqual(audit['offCenterSingletons'],[])

    def test_shared_side_has_distinct_ports(self):
        routes,audit=clean_routes([[0,0],[100,-25],[100,0],[100,25]],[[30,30]]*4,
            [(0,1),(0,2),(0,3)],
            [[(15,0),(50,0),(50,-25),(85,-25)],[(15,0),(85,0)],[(15,0),(50,0),(50,25),(85,25)]])
        self.assertEqual(audit['sharedPortDuplicates'],[])
        self.assertEqual(audit['nonorthogonalSegments'],0)


if __name__=='__main__':unittest.main()
